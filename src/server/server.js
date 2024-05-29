require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');
const cors = require('cors');

const app = express();
app.use(cors());

(async () => {
  try {
    const model = await loadModel();
    app.locals.model = model;

    app.use(express.json());
    app.use(routes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      if (err instanceof InputError) {
        return res.status(400).json({
          status: 'fail',
          message: `${err.message} Silakan gunakan foto lain.`
        // message : 'Terjadi kesalahan dalam melakukan prediksi'
        });
      }
      if (err.code === 'LIMIT_FILE_SIZE') { // Multer specific error for file size limit
        return res.status(413).json({
          status: 'fail',
          message: 'Payload content length greater than maximum allowed: 1000000'
        });
      }
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          status: 'fail',
          message: err.message
        });
      }
      res.status(500).json({
        status: 'fail',
        message: `Terjadi kesalahan ${err.message} `
      });
    });

    const port = process.env.PORT || 3000;
    // const port = 3000
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();
