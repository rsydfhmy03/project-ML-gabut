const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  postPredictHandler,
  savePredictHandler,
  getHistoriesHandler,
  registerHandler,
  loginHandler,
  logoutHandler,
  updatePasswordHandler,
  getUserDetailHandler,
  updateAvatarHandler, 
  updateProfileHandler
} = require('./handler');
const authenticate = require('../middleware/authenticate');
const avatar = require('../middleware/avatar');

const upload = multer({
  limits: { fileSize: 5000000 }, // 5MB
  storage: multer.memoryStorage()
});
  
router.post('/auth/register', registerHandler);
router.post('/auth/login', loginHandler);
router.post('/predict', upload.single('image'), postPredictHandler);
router.post('/predict/save', authenticate, savePredictHandler);
router.get('/predict/histories', authenticate, getHistoriesHandler);
router.post('/auth/logout', authenticate, logoutHandler);
router.put('/auth/update-password', authenticate,updatePasswordHandler );
router.get('/user/detail', authenticate, getUserDetailHandler);
router.post('/user/avatar', authenticate, avatar.single('avatar'), updateAvatarHandler);
router.put('/user/update', authenticate, updateProfileHandler)

module.exports = router;
