import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBd7OSQKhHA-iY4ET5JQOF-PDwb-fIQ46Y",
  authDomain: "kobestyaosani.firebaseapp.com",
  projectId: "kobestyaosani",
  storageBucket: "kobestyaosani.firebasestorage.app",
  messagingSenderId: "30467496929",
  appId: "1:30467496929:web:2d49f73e90388c2fcd10a0"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);