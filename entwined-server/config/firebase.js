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
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_KEY JSON:", error.message);
  }
} else {
  console.warn("⚠️ Warning: FIREBASE_KEY is missing from .env. Firebase storage will not be available.");
}

module.exports = bucket;