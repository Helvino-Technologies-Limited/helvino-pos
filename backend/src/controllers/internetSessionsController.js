const { query, transaction } = require('../config/db');
const { success, created, notFound, badRequest } = require('../utils/response');
const { generateTicketNumber, calculateSessionCost } = require('../utils/helpers');

const startSession = async (req, res) => {
  const {
    computer_id, customer_id, scheduled_duration_minutes,
    rate_per_hour, payment_method = 'cash', paid_amount = 0
  } = req.body;

  const result = await transaction(async (client) => {
    const comp = await client.query(
      'SELECT * FROM computers WHERE id = $1 FOR UPDATE', [computer_id]
    );
    if (!comp.rows.length) throw { statusCode: 404, message: 'Computer not found', isOperational: true };
    if (comp.rows[0].status === 'in_use') throw { statusCode: 400, message: 'Computer is already in use', isOperational: true };

    await client.query(
      "UPDATE computers SET status = 'in_use' WHERE id = $1", [computer_id]
    );

    const defaultRate = rate_per_hour || 30;
    const ticketNumber = generateTicketNumber();

    const sessionResult = await client.query(
      `INSERT INTO internet_sessions (
        branch_id, computer_id, customer_id, employee_id, shift_id,
        ticket_number, rate_per_hour, scheduled_duration_minutes,
        paid_amount, payment_method, status
      ) VALUES (
        $1,$2,$3,$4,
        (SELECT id FROM shifts WHERE employee_id = $4 AND status = 'open' ORDER BY start_time DESC LIMIT 1),
        $5,$6,$7,$8,$9,'active'
      ) RETURNING *`,
      [
        req.user.branch_id, computer_id, customer_id || null,
        req.user.id, ticketNumber, defaultRate,
        scheduled_duration_minutes || null, paid_amount, payment_method
      ]
    );

    return sessionResult.rows[0];
  });

  return created(res, result, 'Session started');
};

const endSession = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const result = await transaction(async (client) => {
    const sess = await client.query(
      'SELECT * FROM internet_sessions WHERE id = $1 FOR UPDATE', [id]
    );
    if (!sess.rows.length) throw { statusCode: 404, message: 'Session not found', isOperational: true };
    if (sess.rows[0].status !== 'active') throw { statusCode: 400, message: 'Session is not active', isOperational: true };

    const session = sess.rows[0];
    const endTime = new Date();
    const durationMins = Math.ceil((endTime - new Date(session.start_time)) / 60000);
    const cost = calculateSessionCost(session.start_time, endTime, session.rate_per_hour);
    const balanceDue = Math.max(0, cost - parseFloat(session.paid_amount || 0));
    const status = balanceDue > 0 ? 'unpaid' : 'completed';

    await client.query(
      `UPDATE internet_sessions SET
        end_time = $1, actual_duration_minutes = $2, cost = $3,
        status = $4, notes = $5
       WHERE id = $6`,
      [endTime, durationMins, cost, status, notes || null, id]
    );

    await client.query(
      "UPDATE computers SET status = 'available' WHERE id = $1",
      [session.computer_id]
    );

    return { ...session, end_time: endTime, cost, duration_minutes: durationMins, balance_due: balanceDue, status };
  });

  return success(res, result, 'Session ended');
};

const paySession = async (req, res) => {
  const { id } = req.params;
  const { amount, payment_method, mpesa_ref } = req.body;

  const result = await transaction(async (client) => {
    const sess = await client.query(
      'SELECT * FROM internet_sessions WHERE id = $1 FOR UPDATE', [id]
    );
    if (!sess.rows.length) throw { statusCode: 404, message: 'Session not found', isOperational: true };

    const session = sess.rows[0];
    const newPaid = parseFloat(session.paid_amount || 0) + parseFloat(amount);
    const balanceDue = Math.max(0, parseFloat(session.cost) - newPaid);
    const status = balanceDue <= 0 ? 'completed' : session.status;

    await client.query(
      `UPDATE internet_sessions SET paid_amount = $1, status = $2, payment_method = $3, mpesa_ref = $4 WHERE id = $5`,
      [newPaid, status, payment_method || session.payment_method, mpesa_ref || session.mpesa_ref, id]
    );

    return { session_id: id, paid: newPaid, balance_due: balanceDue };
  });

  return success(res, result, 'Payment recorded');
};

const getActiveSessions = async (req, res) => {
  const result = await query(
    `SELECT s.*, c.name as customer_name, comp.name as computer_name, comp.station_number,
            EXTRACT(EPOCH FROM (NOW() - s.start_time))/60 AS current_duration_minutes,
            (EXTRACT(EPOCH FROM (NOW() - s.start_time))/3600 * s.rate_per_hour) AS current_cost
     FROM internet_sessions s
     LEFT JOIN customers c ON s.customer_id = c.id
     LEFT JOIN computers comp ON s.computer_id = comp.id
     WHERE s.status = 'active'
     ${req.user.branch_id ? 'AND s.branch_id = $1' : ''}
     ORDER BY s.start_time ASC`,
    req.user.branch_id ? [req.user.branch_id] : []
  );
  return success(res, result.rows);
};

const getSessionHistory = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = Math.max(0, parseInt(req.query.offset) || 0);
  const { start_date, end_date, computer_id, customer_id } = req.query;

  let conditions = ["s.status != 'active'"];
  let params = [];
  let i = 1;

  if (req.user.branch_id) { conditions.push(`s.branch_id = $${i++}`); params.push(req.user.branch_id); }
  if (start_date) { conditions.push(`s.created_at >= $${i++}`); params.push(start_date); }
  if (end_date) { conditions.push(`s.created_at <= $${i++}`); params.push(end_date + ' 23:59:59'); }
  if (computer_id) { conditions.push(`s.computer_id = $${i++}`); params.push(computer_id); }
  if (customer_id) { conditions.push(`s.customer_id = $${i++}`); params.push(customer_id); }

  const where = conditions.join(' AND ');
  const result = await query(
    `SELECT s.*, c.name as customer_name, comp.name as computer_name, comp.station_number
     FROM internet_sessions s
     LEFT JOIN customers c ON s.customer_id = c.id
     LEFT JOIN computers comp ON s.computer_id = comp.id
     WHERE ${where}
     ORDER BY s.start_time DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  );
  return success(res, result.rows);
};

const getComputerStatus = async (req, res) => {
  const result = await query(
    `SELECT comp.*,
      CASE WHEN comp.status = 'in_use' THEN
        (SELECT row_to_json(s) FROM (
          SELECT is2.id, is2.ticket_number, is2.start_time, is2.rate_per_hour,
                 c.name as customer_name,
                 EXTRACT(EPOCH FROM (NOW() - is2.start_time))/60 AS duration_minutes,
                 (EXTRACT(EPOCH FROM (NOW() - is2.start_time))/3600 * is2.rate_per_hour) AS current_cost
          FROM internet_sessions is2
          LEFT JOIN customers c ON is2.customer_id = c.id
          WHERE is2.computer_id = comp.id AND is2.status = 'active'
          LIMIT 1
        ) s)
      ELSE NULL END as active_session
     FROM computers comp
     WHERE comp.is_active = true
     ${req.user.branch_id ? 'AND comp.branch_id = $1' : ''}
     ORDER BY comp.station_number ASC`,
    req.user.branch_id ? [req.user.branch_id] : []
  );
  return success(res, result.rows);
};

module.exports = { startSession, endSession, paySession, getActiveSessions, getSessionHistory, getComputerStatus };
