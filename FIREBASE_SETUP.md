// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAf-cDXxiCE8z_K44qnwfkcoIsRVWRrm4Q",
  authDomain: "ulishome-12d94.firebaseapp.com",
  projectId: "ulishome-12d94",
  storageBucket: "ulishome-12d94.firebasestorage.app",
  messagingSenderId: "248601284699",
  appId: "1:248601284699:web:31c3d2e57bfc15975fef7e",
  measurementId: "G-ZVXQ2YY2YW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);