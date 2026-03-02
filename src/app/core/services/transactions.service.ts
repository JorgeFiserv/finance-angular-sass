import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class TransactionsService {
  private firestore = inject(Firestore);

  listen(uid: string, callback: (transactions: any[]) => void) {
    const transctionRef = collection(this.firestore, `users/${uid}/transactions`);
    const q = query(transctionRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(transactions);
    });
  }
  //*CREATE*//
  async create(uid: string, transaction: any) {
    const transctionRef = collection(this.firestore, `users/${uid}/transactions`);
    return addDoc(transctionRef, {
      ...transaction,
      createdAt: serverTimestamp(),
    });
  }
  //*UPDATE*//
  async update(uid: string, txId: string, transaction: any) {
    const txRef = doc(this.firestore, `users/${uid}/transactions/${txId}`);
    await updateDoc(txRef, {
      ...transaction,
      updatedAt: serverTimestamp(),
    });
  }
  //*DELETE*//
  async delete(uid: string, txId: string) {
    const txRef = doc(this.firestore, `users/${uid}/transactions/${txId}`);
    await deleteDoc(txRef);
  }
}
