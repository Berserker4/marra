import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // 👈 nuevo

const firebaseConfig = {
  apiKey: "AIzaSyDegXHfs6RQgfn2TF4ZhOf04rl3cHzxqR8",
  authDomain: "marra-distribuciones.firebaseapp.com",
  projectId: "marra-distribuciones",
  storageBucket: "marra-distribuciones.firebasestorage.app",
  messagingSenderId: "310047365504",
  appId: "1:310047365504:web:2bf7441d609098fa204965",
  measurementId: "G-NHKKNZ51GC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 👈 exportás auth
export const provider = new GoogleAuthProvider(); // 👈 proveedor Google
