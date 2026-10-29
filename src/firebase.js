import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAyuB0Aor8Sarl6N-ttx17MmxFduVCsbIQ',
  authDomain: 'rehouse-19a6c.firebaseapp.com',
  projectId: 'rehouse-19a6c',
  storageBucket: 'rehouse-19a6c.firebasestorage.app',
  messagingSenderId: '1049519492771',
  appId: '1:1049519492771:web:626313969a263af7a6b916',
  measurementId: 'G-9XL483ES26'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
