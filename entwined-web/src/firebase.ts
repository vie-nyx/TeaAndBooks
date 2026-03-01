import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyBDBMGvP9Tf9_Dj-Gl2YNtaJF7Tf1zyK9E",
  authDomain: "entwined-aeeaa.firebaseapp.com",
  projectId: "entwined-aeeaa",
  storageBucket: "entwined-aeeaa.firebasestorage.app",
  messagingSenderId: "1029531006959",
  appId: "1:1029531006959:web:d2a1702ad0b07cc5ace81a",
  measurementId: "G-NL35D093BJ"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);