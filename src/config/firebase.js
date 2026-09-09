// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";
import { Platform } from "react-native";

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

// Firestore dengan cache persisten (offline) aktif di web.
// Native memakai getFirestore biasa (JS SDK belum mendukung IndexedDB offline).
export const db =
  Platform.OS === 'web'
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
      })
    : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);