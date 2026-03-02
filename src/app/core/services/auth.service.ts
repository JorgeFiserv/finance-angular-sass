import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  // Registrar novo usuário
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(auth, email, password));
  }

  // Login
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(auth, email, password));
  }

  // Logout
  logout(): Observable<void> {
    return from(signOut(auth));
  }

  // Obter usuário autenticado
  getCurrentUser(): Observable<User | null> {
    return new Observable((observer) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        observer.next(user);
      });
      return () => unsubscribe();
    });
  }

  // Verificar se está autenticado
  isAuthenticated(): Observable<boolean> {
    return this.getCurrentUser().pipe(map((user) => !!user));
  }
}
