import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCe-5QJCogy4I0EtKuJQgWzcWFkTInwL28",
  authDomain: "miequipaje-4a0db.firebaseapp.com",
  projectId: "miequipaje-4a0db",
  storageBucket: "miequipaje-4a0db.firebasestorage.app",
  messagingSenderId: "1085575057945",
  appId: "1:1085575057945:web:9c20804814ed774133d088",
  measurementId: "G-C566TZ63RY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Inicializa Firestore

export { auth, db };