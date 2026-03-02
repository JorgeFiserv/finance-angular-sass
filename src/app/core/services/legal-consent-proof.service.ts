import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from '@angular/fire/firestore';
import { ConsentPolicyType, ConsentService } from './consent.service';

@Injectable({
  providedIn: 'root',
})
export class LegalConsentProofService {
  private firestore = inject(Firestore);
  private consentService = inject(ConsentService);

  async recordConsent(
    uid: string,
    policyType: ConsentPolicyType,
    accepted: boolean,
    method: string,
  ): Promise<void> {
    const policyVersion = this.consentService.getCurrentPolicyVersion();
    const policyUrl = this.consentService.getPolicyUrl(policyType);
    const locale = this.getLocale();

    const historyRef = collection(this.firestore, `users/${uid}/legalConsents`);

    const event = await addDoc(historyRef, {
      uid,
      policyType,
      policyVersion,
      policyUrl,
      accepted,
      method,
      locale,
      acceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    const currentRef = doc(this.firestore, `users/${uid}/legalConsentCurrent/${policyType}`);

    await setDoc(
      currentRef,
      {
        uid,
        policyType,
        policyVersion,
        policyUrl,
        accepted,
        method,
        locale,
        lastEventId: event.id,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async recordCoreLegalAcceptance(uid: string, method: string): Promise<void> {
    await Promise.all([
      this.recordConsent(uid, 'terms', true, method),
      this.recordConsent(uid, 'privacy', true, method),
    ]);
  }

  private getLocale(): string {
    try {
      return navigator.language || 'pt-BR';
    } catch {
      return 'pt-BR';
    }
  }
}
