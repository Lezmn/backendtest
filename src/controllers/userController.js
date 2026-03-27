const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const result = await userService.getAll(req.query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    sendSuccess(res, null, 204);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const user = await userService.updateStatus(
      req.params.id,
      req.body.is_active
    );
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};