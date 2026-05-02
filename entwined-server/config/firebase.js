const admin = require("firebase-admin");

const serviceAccount = JSON.parse(
  process.env.FIREBASE_KEY
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "YOUR_BUCKET.appspot.com"
});

const bucket = admin.storage().bucket();

module.exports = bucket;