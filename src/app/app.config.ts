import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: 'AIzaSyDJEJQfkcVDzHYET0lTSSbxH-DGBel6XWk',
  authDomain: 'finance-angular-sass.firebaseapp.com',
  projectId: 'finance-angular-sass',
  storageBucket: 'finance-angular-sass.firebasestorage.app',
  messagingSenderId: '348647215749',
  appId: '1:348647215749:web:87cb332c1838dc5796cfec',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
  ],
};
