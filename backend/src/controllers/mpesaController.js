const axios = require('axios');
const { mpesa } = require('../config/env');
const { query } = require('../config/db');
const { success, badRequest } = require('../utils/response');
const logger = require('../utils/logger');

const getAccessToken = async () => {
  const base64 = Buffer.from(`${mpesa.consumerKey}:${mpesa.consumerSecret}`).toString('base64');
  const url = mpesa.env === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${base64}` },
  });
  return response.data.access_token;
};

const generatePassword = () => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${mpesa.shortcode}${mpesa.passkey}${timestamp}`).toString('base64');
  return { password, timestamp };
};

const stkPush = async (req, res) => {
  const { phone, amount, reference_type, reference_id, account_reference } = req.body;

  if (!mpesa.consumerKey || mpesa.consumerKey === 'your_consumer_key') {
    return badRequest(res, 'M-Pesa is not configured. Update your .env file.');
  }

  try {
    const token = await getAccessToken();
    const { password, timestamp } = generatePassword();
    const url = mpesa.env === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const response = await axios.post(url, {
      BusinessShortCode: mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(parseFloat(amount)),
      PartyA: phone,
      PartyB: mpesa.shortcode,
      PhoneNumber: phone,
      CallBackURL: mpesa.callbackUrl,
      AccountReference: account_reference || 'HelvinoPOS',
      TransactionDesc: 'Payment',
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await query(
      `INSERT INTO mpesa_transactions
       (merchant_request_id, checkout_request_id, phone_number, amount, reference_type, reference_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [
        response.data.MerchantRequestID,
        response.data.CheckoutRequestID,
        phone, amount, reference_type, reference_id
      ]
    );

    return success(res, {
      checkout_request_id: response.data.CheckoutRequestID,
      customer_message: response.data.CustomerMessage,
    }, 'STK push sent successfully');
  } catch (err) {
    logger.error('M-Pesa STK push error:', err.response?.data || err.message);
    return badRequest(res, err.response?.data?.errorMessage || 'M-Pesa request failed');
  }
};

const callback = async (req, res) => {
  try {
    const callbackData = req.body?.Body?.stkCallback;
    if (!callbackData) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;
    const status = ResultCode === 0 ? 'success' : 'failed';

    let mpesaReceipt = null;
    if (CallbackMetadata?.Item) {
      const receiptItem = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber');
      if (receiptItem) mpesaReceipt = receiptItem.Value;
    }

    await query(
      `UPDATE mpesa_transactions SET
         status = $1, result_code = $2, result_desc = $3, mpesa_receipt_number = $4
       WHERE checkout_request_id = $5`,
      [status, String(ResultCode), ResultDesc, mpesaReceipt, CheckoutRequestID]
    );

    logger.info(`M-Pesa callback: ${CheckoutRequestID} -> ${status} (${mpesaReceipt})`);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    logger.error('M-Pesa callback error:', err);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

const checkStatus = async (req, res) => {
  const result = await query(
    'SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1',
    [req.params.checkoutRequestId]
  );
  if (!result.rows.length) return success(res, { status: 'not_found' });
  return success(res, result.rows[0]);
};

module.exports = { stkPush, callback, checkStatus };
