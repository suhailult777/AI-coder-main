// Firebase configuration for client-side authentication
// This file contains the Firebase configuration for Google authentication

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration
// Note: These are public configuration values and are safe to expose
const firebaseConfig = {
  apiKey: "AIzaSyDemo-Replace-With-Your-Actual-API-Key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Export authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};

export { auth };

// For demo purposes, we'll also export a mock Google sign-in function
export const mockGoogleSignIn = async () => {
  // This simulates a successful Google sign-in for demo purposes
  return {
    uid: 'demo-uid-' + Date.now(),
    email: 'demo@example.com',
    displayName: 'Demo User',
    photoURL: 'https://via.placeholder.com/100x100?text=Demo',
    getIdToken: async () => {
      // Return a mock token for demo purposes
      return 'mock-firebase-token-' + Date.now();
    }
  };
};
