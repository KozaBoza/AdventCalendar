// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAC6qE-rKHFKMp4yKdYvI8XbyS1EGDGvcE",
  authDomain: "advent-38387.firebaseapp.com",
  projectId: "advent-38387",
  storageBucket: "advent-38387.firebasestorage.app",
  messagingSenderId: "90928434056",
  appId: "1:90928434056:web:21b7f1aea62b6d5939883d",
  measurementId: "G-2LMQQRPDHV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);