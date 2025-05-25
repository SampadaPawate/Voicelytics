// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getApp, getApps } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCqOH4djGLn-b6oNi_U8Tt4OGVpyt0Q0PI",
    authDomain: "voicelytics-6a15c.firebaseapp.com",
    projectId: "voicelytics-6a15c",
    storageBucket: "voicelytics-6a15c.firebasestorage.app",
    messagingSenderId: "50432491513",
    appId: "1:50432491513:web:72b70bf281b241d8a50728",
    measurementId: "G-9NCCRBK680"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);