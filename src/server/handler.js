const predictClassification = require('../services/inferenceService');
const storeData = require('../services/storeData');
const getHistories = require('../services/getHistories');
// const authService = require('../services/authService');
const bcrypt = require('bcrypt');
const { registerUser, loginUser } = require('../services/authService');
const crypto = require('crypto');
const { InputError } = require('../exceptions/InputError');
const { addTokenToBlacklist } = require('../middleware/blacklistToken');
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore(); // Initialize Firestore
const bucket = require('../config/storageConfig');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
    res.status(500).json({
      status: 'fail',
      message: error.message,
      data: {}
    });
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
    res.status(500).json({
      status: 'fail',
      message: error.message,
      data: {}
    });
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
    res.status(500).json({
      status: 'fail',
      message: error.message,
      data: {}
    });
  }
}

async function registerHandler(req, res, next) {
    try {
      const userData = req.body;
      const result = await registerUser(userData);
      res.status(200).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
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
      const result = await loginUser({ email, password });
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        status: 'fail',
        message: error.message,
        data: {}
      });
    }
  }

 
  async function updatePasswordHandler(req, res, next) {
    try {
      const { old_password, password, password_confirmation } = req.body;
      const user = req.user;
  
      if (password !== password_confirmation) {
        return res.status(400).json({
          status: 'fail',
          message: 'Password confirmation does not match',
          data: {}
        });
      }
  
      const userRef = firestore.collection('users').doc(user.email);
      const doc = await userRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({
          status: 'fail',
          message: 'User not found',
          data: {}
        });
      }
  
      const userData = doc.data();
      const match = await bcrypt.compare(old_password, userData.password);
  
      if (!match) {
        return res.status(401).json({
          status: 'fail',
          message: 'Old password is incorrect',
          data: {}
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      await userRef.update({ password: hashedPassword });
  
      res.status(202).json({
        status: 'success',
        message: 'Password changed',
        data: []
      });
    } catch (error) {
      // next(error);
      res.status(500).json({
        status: 'fail',
        message: error.message,
        data: {}
      });
    }
  }
  
  async function logoutHandler(req, res, next) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      addTokenToBlacklist(token);
  
      res.status(200).json({
        status: 'success',
        message: 'Logout successful',
        data: {}
      });
    } catch (error) {
      res.status(500).json({
        status: 'fail',
        message: error.message,
        data: {}
      });
    }
  }

  async function getUserDetailHandler(req, res, next) {
    try {
      const user = req.user;
      const userRef = firestore.collection('users').doc(user.email);
      const doc = await userRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({
          status: 'fail',
          message: 'User not found',
          data: {}
        });
      }
  
      const userData = doc.data();
  
      res.status(200).json({
        status: 'success',
        message: 'User detail fetched successfully',
        data: {
          id: userData.id,
          name: userData.name,
          gender: userData.gender,
          birth_date: userData.birth_date,
          email: userData.email,
          email_verified_at: userData.email_verified_at || null,
          avatar: userData.avatar || null,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'fail',
        message: error.message,
        data: {}
      });
    }
  }

  async function updateAvatarHandler(req, res, next) {
    try {
      const user = req.user;
      const file = req.file;
  
      if (!file) {
        return res.status(400).json({
          status: 'fail',
          message: 'No file uploaded',
          data: {}
        });
      }
  
      const blob = bucket.file(`avatars/${uuidv4()}_${path.basename(file.originalname)}`);
      const blobStream = blob.createWriteStream({
        resumable: false
      });
  
      blobStream.on('error', (err) => {
        next(err);
      });
  
      blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
  
        const userRef = firestore.collection('users').doc(user.email);
        const doc = await userRef.get();
  
        if (!doc.exists) {
          return res.status(404).json({
            status: 'fail',
            message: 'User not found',
            data: {}
          });
        }
  
        await userRef.update({ avatar: publicUrl, updated_at: new Date().toISOString() });
  
        const updatedUser = (await userRef.get()).data();
  
        res.status(200).json({
          status: 'success',
          message: 'Avatar updated successfully',
          data: updatedUser
        });
      });
  
      blobStream.end(file.buffer);
    } catch (error) {
      res.status(500).json({
        status: 'fail',
        message: error.message,
        data: {}
      });
    }
  }
  async function updateProfileHandler(req, res, next) {
    try {
      const user = req.user;
      const { name, gender, birth_date } = req.body;
  
      const userRef = firestore.collection('users').doc(user.email);
      const doc = await userRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({
          status: 'fail',
          message: 'User not found',
          data: {}
        });
      }
  
      await userRef.update({
        name,
        gender,
        birth_date,
        updated_at: new Date().toISOString()
      });
  
      const updatedUser = (await userRef.get()).data();
  
      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(500).json({
        status: 'fail',
        message: error.message,
        data: {}
      });
    }
  }
  
  module.exports = { postPredictHandler, 
    savePredictHandler, 
    getHistoriesHandler, 
    registerHandler, 
    loginHandler, 
    logoutHandler , 
    updatePasswordHandler, 
    getUserDetailHandler,
    updateAvatarHandler,
    updateProfileHandler};
