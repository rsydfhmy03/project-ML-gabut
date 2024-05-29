const predictClassification = require('../services/inferenceService');
const storeData = require('../services/storeData');
const getHistories = require('../services/getHistories');
const authService = require('../services/authService');
const crypto = require('crypto');
const { InputError } = require('../exceptions/InputError');

async function postPredictHandler(req, res, next) {
  try {
    const image = req.file;
    if (!image) {
      throw new InputError('Image is required');
    }

    const { model } = req.app.locals;
    const { confidenceScore, label, suggestion } = await predictClassification(model, image.buffer);

    res.status(200).json({
      status: 'success',
      message: 'Model is predicted successfully',
      data: {
        confidenceScore,
        label,
        suggestion
      }
    });
  } catch (error) {
    next(error);
  }
}

async function savePredictHandler(req, res, next) {
  try {
    const { confidenceScore, label, suggestion } = req.body;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const email = req.user.email;
    
    const data = {
      id,
      result: label,
      suggestion,
      confidenceScore,
      createdAt,
      email
    };

    await storeData(id, data);

    res.status(201).json({
      status: 'success',
      message: 'Prediction saved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getHistoriesHandler(req, res, next) {
  try {
    const email = req.user.email;
    const histories = await getHistories(email);
    res.status(200).json({
      status: 'success',
      data: histories
    });
  } catch (error) {
    next(error);
  }
}

async function registerHandler(req, res, next) {
  try {
    const user = req.body;
    const { token, user: registeredUser } = await authService.register(user);
    res.status(200).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        access_token: token,
        user: registeredUser
      }
    });
  } catch (error) {
    res.status(409).json({
      status: 'fail',
      message: error.message,
      data: {}
    });
  }
}

async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        access_token: token,
        user
      }
    });
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: error.message,
      data: {}
    });
  }
}

module.exports = { postPredictHandler, savePredictHandler, getHistoriesHandler, registerHandler, loginHandler };
