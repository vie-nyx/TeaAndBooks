const admin = require("firebase-admin");
const serviceAccount = require("../firebaseKey.json"); // uses the file directly, no env variable needed

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

module.exports = admin;