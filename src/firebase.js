// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
