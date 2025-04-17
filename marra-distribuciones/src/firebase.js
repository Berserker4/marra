import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ Reemplazá con tu configuración real de Firebase
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "ID_DEL_PROYECTO",
  storageBucket: "BUCKET.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);