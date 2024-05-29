const { Storage } = require('@google-cloud/storage');

// Inisialisasi client Google Cloud Storage tanpa keyFilename
const storage = new Storage();

const bucketName = 'soothemate-zseconds';
const bucket = storage.bucket(bucketName);

module.exports = bucket;
