// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyALdQM11sXUg_01A4-OCwrwwn9TEOJeimg",
  authDomain: "spy-game-778fe.firebaseapp.com",
  projectId: "spy-game-778fe",
  storageBucket: "spy-game-778fe.firebasestorage.app",
  messagingSenderId: "531628812108",
  appId: "1:531628812108:web:f1e13250d2f739371751e9",
  measurementId: "G-7T1M7G35YZ",
  databaseURL: "https://spy-game-778fe-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, onValue, push, update };
