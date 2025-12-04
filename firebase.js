// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 1. Dodajemy import bazy danych

// Twoja konfiguracja (zachowałem Twoje dane)
const firebaseConfig = {
  apiKey: "AIzaSyAC6qE-rKHFKMp4yKdYvI8XbyS1EGDGvcE",
  authDomain: "advent-38387.firebaseapp.com",
  projectId: "advent-38387",
  storageBucket: "advent-38387.firebasestorage.app",
  messagingSenderId: "90928434056",
  appId: "1:90928434056:web:21b7f1aea62b6d5939883d",
  measurementId: "G-2LMQQRPDHV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicjalizujemy bazę danych i ją EKSPORTUJEMY, żeby inne pliki ją widziały
export const db = getFirestore(app);