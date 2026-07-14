const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';

const files = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

const downloadFile = (file) => {
  return new Promise((resolve, reject) => {
    const dest = path.join(modelsDir, file);
    if (fs.existsSync(dest)) {
      console.log(`Skipping ${file}, already exists.`);
      return resolve();
    }
    console.log(`Downloading ${file}...`);
    const fileStream = fs.createWriteStream(dest);
    https.get(baseUrl + file, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Finished ${file}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      console.error(`Error downloading ${file}: ${err.message}`);
      reject(err);
    });
  });
};

async function downloadAll() {
  for (const file of files) {
    await downloadFile(file);
  }
  console.log('All models downloaded.');
}

downloadAll();
