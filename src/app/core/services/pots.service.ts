import { Injectable, inject } from '@angular/core';
import { Pot } from '../../shared/models/Pot.model';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class PotsService {
  private firestore = inject(Firestore);
  /*========Reference========*/
  private potsCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/pots`);
  }

  /*====Listeners====*/
  listen(userId: string, callback: (pots: Pot[]) => void) {
    const q = query(this.potsCollection(userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const pots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pot[];
      callback(pots);
    });
  }

  /*====CRUD====*/
  async create(userId: string, pot: Partial<Pot>) {
    await addDoc(this.potsCollection(userId), {
      name: pot.name || '',
      targetAmount: pot.targetAmount || 0,
      currentAmount: 0,
      color: pot.color || '#2bb0a6',
      createdAt: serverTimestamp(),
    });
  }

  async addMoney(userId: string, potId: string, amount: number) {
    amount = Number(amount);
    if (amount <= 0) throw new Error('Invalid amount');

    const ref = doc(this.firestore, `users/${userId}/pots/${potId}`);

    return runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);

      if (!snap.exists()) throw new Error('Pot not found');

      const data = snap.data() as Pot;

      const currentAmount = data.currentAmount ?? 0;
      const targetAmount = data.targetAmount ?? 0;

      let newAmount = currentAmount + amount;

      if (newAmount > targetAmount) {
        newAmount = targetAmount;
      }

      tx.update(ref, { currentAmount: newAmount });
    });
  }

  //==== whitdraw money ====//
  async withdrawMoney(userId: string, potId: string, amount: number) {
    amount = Number(amount);
    if (amount <= 0) throw new Error('Invalid amount');
    const ref = doc(this.firestore, `users/${userId}/pots/${potId}`);
    return runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Pot not found');
      const data = snap.data() as Pot;

      const currentAmount = data.currentAmount ?? 0;

      if (currentAmount < amount) {
        throw new Error('Insufficient funds');
      }

      tx.update(ref, {
        currentAmount: currentAmount - amount,
      });
    });
  }

  //==== delete pot ==//
  async remove(userId: string, potId: string) {
    await deleteDoc(doc(this.firestore, `users/${userId}/pots/${potId}`));
  }
}
