import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCe-5QJCogy4I0EtKuJQgWzcWFkTInwL28",
  authDomain: "miequipaje-4a0db.firebaseapp.com",
  projectId: "miequipaje-4a0db",
  storageBucket: "miequipaje-4a0db.firebasestorage.app",
  messagingSenderId: "1085575057945",
  appId: "1:1085575057945:web:9c20804814ed774133d088",
  measurementId: "G-C566TZ63RY"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// 👇 Usa AsyncStorage para que Firebase Auth recuerde la sesión
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
