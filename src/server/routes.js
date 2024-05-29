const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  postPredictHandler,
  savePredictHandler,
  getHistoriesHandler,
  registerHandler,
  loginHandler
} = require('./handler');
const authenticate = require('../middleware/authenticate');

const upload = multer({
  limits: { fileSize: 1000000 }, // 1MB
  storage: multer.memoryStorage()
});

router.post('/auth/register', registerHandler);
router.post('/auth/login', loginHandler);
router.post('/predict', upload.single('image'), postPredictHandler);
router.post('/predict/save', authenticate, savePredictHandler);
router.get('/predict/histories', authenticate, getHistoriesHandler);

module.exports = router;
