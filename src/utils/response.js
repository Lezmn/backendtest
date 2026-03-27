exports.sendSuccess = (res, data, status = 200) => {
  // 204 ไม่ส่ง body
  if (status === 204) return res.status(204).send();
  res.status(status).json({ success: true, data });
};

exports.sendError = (res, message, status = 500, errors = undefined) => {

  const payload = {
    success: false,
    message,
    errors: [] ,
    timestamp: new Date().toISOString(),
  };

    if (errors && errors.length) {
    payload.errors = errors;
  }
  res.status(status).json(payload);
};