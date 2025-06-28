// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAE2L8gEwYV5l2FYYOpOAgKIzF7ewO_we0",
  authDomain: "course-sell-d8109.firebaseapp.com",
  projectId: "course-sell-d8109",
  storageBucket: "course-sell-d8109.firebasestorage.app",
  messagingSenderId: "984245906845",
  appId: "1:984245906845:web:084403eb131872cac31374"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
}); 