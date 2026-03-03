import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast';
import { Auth, authState } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConsentService } from './core/services/consent.service';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { LegalConsentProofService } from './core/services/legal-consent-proof.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private consentService = inject(ConsentService);
  private legalConsentProofService = inject(LegalConsentProofService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  user = toSignal(authState(this.auth), { initialValue: null });
  showCookieBanner = signal(false);
  showPolicyModal = signal(false);

  private readonly publicRoutes = ['/app/login', '/app/register', '/privacy', '/terms'];

  protected readonly title = signal('finance-angular-sass');

  constructor() {
    this.showCookieBanner.set(!this.consentService.hasCookieConsent());

    effect(() => {
      const user = this.user();
      if (!user) {
        this.showPolicyModal.set(false);
        return;
      }

      if (
        this.router.url === '/' ||
        this.publicRoutes.some((route) => this.router.url.startsWith(route))
      ) {
        this.showPolicyModal.set(false);
        return;
      }

      const hasAcceptedPolicy = this.consentService.hasAcceptedCurrentPolicy(user.uid);
      this.showPolicyModal.set(!hasAcceptedPolicy);
    });
  }

  async acceptEssentialCookies() {
    this.consentService.acceptEssentialCookies();

    const user = this.user();
    if (user) {
      try {
        await this.legalConsentProofService.recordConsent(
          user.uid,
          'cookies-essential',
          true,
          'cookie_banner',
        );
      } catch (error) {
        console.error('Erro ao salvar consentimento de cookies no Firebase:', error);
      }
    }

    this.showCookieBanner.set(false);
  }

  openPrivacyPolicy() {
    this.router.navigate(['/privacy']);
  }

  openTerms() {
    this.router.navigate(['/terms']);
  }

  async acceptPolicyUpdate() {
    const user = this.user();
    if (!user) return;

    try {
      await this.legalConsentProofService.recordCoreLegalAcceptance(
        user.uid,
        'policy_update_modal',
      );
      this.consentService.acceptCurrentPolicy(user.uid);
      this.showPolicyModal.set(false);
    } catch (error) {
      console.error('Erro ao salvar aceite de política no Firebase:', error);
      this.toastService.show(
        'Não foi possível salvar seu consentimento. Tente novamente.',
        'error',
      );
    }
  }

  async declinePolicyUpdate() {
    await firstValueFrom(this.authService.logout());
    this.showPolicyModal.set(false);
    this.router.navigate(['/app/login']);
  }
}
