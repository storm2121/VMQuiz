import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
//
const firebaseConfig = {
  apiKey: "AIzaSyBFEklbQkVk1YXZ5CMST-Kc7OvrYPiE0LU",
  authDomain: "vmqcleaner.firebaseapp.com",
  databaseURL: "https://vmqcleaner-default-rtdb.firebaseio.com",
  projectId: "vmqcleaner",
  storageBucket: "vmqcleaner.appspot.com",
  messagingSenderId: "155277582146",
  appId: "1:155277582146:web:4f4ae64ba51e6b7b27f2db",
  measurementId: "G-7T18PX513C"
};
// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);



