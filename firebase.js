// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 1. Dodajemy import bazy danych

// Twoja konfiguracja (zachowałem Twoje dane)
const firebaseConfig = {
 keys
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicjalizujemy bazę danych i ją EKSPORTUJEMY, żeby inne pliki ją widziały
export const db = getFirestore(app);
