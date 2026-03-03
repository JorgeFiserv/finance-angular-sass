import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDJEJQfkcVDzHYET0lTSSbxH-DGBel6XWk',
  authDomain: 'finance-angular-sass.firebaseapp.com',
  projectId: 'finance-angular-sass',
  storageBucket: 'finance-angular-sass.firebasestorage.app',
  messagingSenderId: '348647215749',
  appId: '1:348647215749:web:87cb332c1838dc5796cfec',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
