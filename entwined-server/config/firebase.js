const admin = require("firebase-admin");

let bucket = null;

if (process.env.FIREBASE_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "YOUR_BUCKET.appspot.com"
    });
    bucket = admin.storage().bucket();
  } catch (err) {
    console.error("Firebase init error:", err.message);
  }
} else {
  console.warn("[firebase.js] FIREBASE_KEY not set — Firebase storage disabled.");
}

module.exports = bucket;