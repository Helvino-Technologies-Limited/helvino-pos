const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    status: 'success',
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { success, created, error, notFound, unauthorized, forbidden, badRequest, paginated };
