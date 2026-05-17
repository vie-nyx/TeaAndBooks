const admin = require("firebase-admin");

let bucket = null;

try {
  if (process.env.FIREBASE_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "YOUR_BUCKET.appspot.com"
    });
    bucket = admin.storage().bucket();
  } else {
    console.warn("⚠️ FIREBASE_KEY not set in environment. Skipping Firebase initialization.");
  }
} catch (err) {
  console.warn("⚠️ Failed to initialize Firebase:", err.message);
}

module.exports = bucket;