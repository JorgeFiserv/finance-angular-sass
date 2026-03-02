import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor() {}

  // Adicionar documento
  addDocument(collectionName: string, data: any): Observable<any> {
    return from(addDoc(collection(firestore, collectionName), data));
  }

  // Obter todos os documentos de uma coleção
  getCollectionData(collectionName: string): Observable<DocumentData[]> {
    return from(
      getDocs(collection(firestore, collectionName)).then((snapshot) =>
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ),
    );
  }

  // Obter documento por ID
  getDocumentById(collectionName: string, documentId: string): Observable<any> {
    return from(
      getDoc(doc(firestore, collectionName, documentId)).then((snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      })),
    );
  }

  // Atualizar documento
  updateDocument(collectionName: string, documentId: string, data: any): Observable<void> {
    return from(updateDoc(doc(firestore, collectionName, documentId), data));
  }

  // Deletar documento
  deleteDocument(collectionName: string, documentId: string): Observable<void> {
    return from(deleteDoc(doc(firestore, collectionName, documentId)));
  }

  // Query customizada
  queryCollection(collectionName: string, constraints: any[]): Observable<DocumentData[]> {
    const q = query(collection(firestore, collectionName), ...constraints);
    return from(
      getDocs(q).then((snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    );
  }
}
