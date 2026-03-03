import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from '@angular/fire/firestore';

import { RecurringBill } from '../../shared/models/RecurringBill.model';

@Injectable({
  providedIn: 'root',
})
export class RecurringBillsService {
  private firestore = inject(Firestore);
  private validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

  private normalizeFrequency(value?: string) {
    if (!value) return null;

    const normalized = value
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const frequencyMap: Record<string, (typeof this.validFrequencies)[number]> = {
      DAILY: 'DAILY',
      DIARIA: 'DAILY',
      WEEKLY: 'WEEKLY',
      SEMANAL: 'WEEKLY',
      MONTHLY: 'MONTHLY',
      MENSAL: 'MONTHLY',
      YEARLY: 'YEARLY',
      ANUAL: 'YEARLY',
    };

    return frequencyMap[normalized] ?? null;
  }

  /* ===== Reference ===== */

  private billsCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/recurringBills`);
  }

  /* ===== Listen (Realtime) ===== */

  listen(userId: string, callback: (bills: RecurringBill[]) => void) {
    const q = query(this.billsCollection(userId), orderBy('nextDueDate', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const bills = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RecurringBill[];

        callback(bills);
      },
      (error) => {
        console.error('Error listening to recurring bills:', error);
        callback([]);
      },
    );
  }

  /* ===== Create ===== */

  async create(userId: string, bill: Partial<RecurringBill>) {
    if (!bill.name?.trim()) {
      throw new Error('Name is required');
    }

    const amount = Number(bill.amount);
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const frequency = this.normalizeFrequency(bill.frequency);
    if (!frequency) {
      throw new Error('Invalid frequency');
    }

    const nextDueDate = new Date(bill.nextDueDate!);
    if (isNaN(nextDueDate.getTime())) {
      throw new Error('Invalid date');
    }

    return addDoc(this.billsCollection(userId), {
      name: bill.name.trim(),
      description: bill.description || '',
      amount,
      currency: bill.currency || 'BRL',
      category: bill.category || 'Uncategorized',
      frequency,
      nextDueDate,
      isActive: true,
      autoDebit: bill.autoDebit || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /* ===== Update ===== */

  async update(userId: string, billId: string, bill: Partial<RecurringBill>) {
    const ref = doc(this.firestore, `users/${userId}/recurringBills/${billId}`);
    const frequency = this.normalizeFrequency(bill.frequency);

    if (!frequency) {
      throw new Error('Invalid frequency');
    }

    return updateDoc(ref, {
      name: bill.name,
      description: bill.description || '',
      amount: Number(bill.amount),
      category: bill.category,
      frequency,
      nextDueDate: new Date(bill.nextDueDate!),
      isActive: bill.isActive ?? true,
      autoDebit: bill.autoDebit || false,
      updatedAt: serverTimestamp(),
    });
  }

  /* ===== Remove ===== */

  async remove(userId: string, billId: string) {
    const ref = doc(this.firestore, `users/${userId}/recurringBills/${billId}`);

    return deleteDoc(ref);
  }

  /* ===== Get By ID ===== */

  async getById(userId: string, billId: string): Promise<RecurringBill> {
    const ref = doc(this.firestore, `users/${userId}/recurringBills/${billId}`);

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error('Bill not found');
    }

    return {
      id: snap.id,
      ...snap.data(),
    } as RecurringBill;
  }
}
