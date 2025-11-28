// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGLvmAypp0tjzL89m2nYO_6mISgvqlx5I",
  authDomain: "otod-voucher.firebaseapp.com",
  projectId: "otod-voucher",
  storageBucket: "otod-voucher.firebasestorage.app",
  messagingSenderId: "679076918684",
  appId: "1:679076918684:web:3d7568912a44a782298459"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };
