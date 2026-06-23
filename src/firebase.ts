import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnXesqJDXHosbNurgQ50hzoZo0kmQK5kU",
  authDomain: "pixelcode-e1472.firebaseapp.com",
  projectId: "pixelcode-e1472",
  storageBucket: "pixelcode-e1472.firebasestorage.app",
  messagingSenderId: "46899148156",
  appId: "1:46899148156:web:f6b40ca8e96c302714e0f9",
  measurementId: "G-4FQD2VW92G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
