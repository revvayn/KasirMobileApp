// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAjMcVTXfVMZFvIO_qmQwUvkGsyuwEUtk",
  authDomain: "kasirmobileapp.firebaseapp.com",
  projectId: "kasirmobileapp",
  storageBucket: "kasirmobileapp.firebasestorage.app",
  messagingSenderId: "270982541784",
  appId: "1:270982541784:web:8634ed09848265711e42ad"
};

// Inisialisasi App
const app = initializeApp(firebaseConfig);

// Export db secara named export
export const db = getFirestore(app);
export const storage = getStorage(app);