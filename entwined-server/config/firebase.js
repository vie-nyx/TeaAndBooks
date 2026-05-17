const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
<<<<<<< HEAD
  storageBucket: "YOUR_BUCKET.appspot.com",
=======
  storageBucket: "your-project-id.appspot.com",
>>>>>>> dc5ba42942924184ae13ab528d32613d13a99e9f
});

const bucket = admin.storage().bucket();

module.exports = bucket;
