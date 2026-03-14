const admin = require("firebase-admin");

const serviceAccount = require("../firebaseKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "YOUR_BUCKET.appspot.com"
});

const bucket = admin.storage().bucket();

module.exports = bucket;