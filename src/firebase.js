import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDegXHfs6RQgfn2TF4ZhOf04rl3cHzxqR8",
  authDomain: "marra-distribuciones.firebaseapp.com",
  projectId: "marra-distribuciones",
  storageBucket: "marra-distribuciones.firebasestorage.app",
  messagingSenderId: "310047365504",
  appId: "1:310047365504:web:bef6b33badef872f204965",
  measurementId: "G-XWY4GTSP7P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

