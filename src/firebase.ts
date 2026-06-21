import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAGOyW48JLICSL_H2X1Lrp3UKsDbcHWprw",
  authDomain: "pixelaistudio.firebaseapp.com",
  databaseURL: "https://pixelaistudio-default-rtdb.firebaseio.com",
  projectId: "pixelaistudio",
  storageBucket: "pixelaistudio.firebasestorage.app",
  messagingSenderId: "469623232368",
  appId: "1:469623232368:web:57aa8aca7418243d8721b5",
  measurementId: "G-MK9VBRJZ2Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
