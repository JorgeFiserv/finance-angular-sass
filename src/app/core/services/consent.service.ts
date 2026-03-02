import { Injectable } from '@angular/core';

export type ConsentPolicyType = 'terms' | 'privacy' | 'cookies-essential';

@Injectable({
  providedIn: 'root',
})
export class ConsentService {
  private readonly cookieConsentKey = 'lgpd_cookie_consent_v1';
  private readonly policyAcceptedPrefix = 'lgpd_policy_acceptance_v';
  private readonly policyVersion = '2026-03-02';

  private get policyStorageKey() {
    return `${this.policyAcceptedPrefix}_${this.policyVersion}`;
  }

  hasCookieConsent(): boolean {
    return this.read(this.cookieConsentKey) === 'accepted';
  }

  acceptEssentialCookies(): void {
    this.write(this.cookieConsentKey, 'accepted');
  }

  hasAcceptedCurrentPolicy(subjectId: string): boolean {
    return this.read(this.userPolicyKey(subjectId)) === 'accepted';
  }

  acceptCurrentPolicy(subjectId: string): void {
    this.write(this.userPolicyKey(subjectId), 'accepted');
  }

  getCurrentPolicyVersion(): string {
    return this.policyVersion;
  }

  getPolicyUrl(policyType: ConsentPolicyType): string {
    if (policyType === 'terms') return '/terms';
    if (policyType === 'privacy') return '/privacy';
    return '/privacy';
  }

  private userPolicyKey(subjectId: string): string {
    return `${this.policyStorageKey}_${subjectId}`;
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
}
