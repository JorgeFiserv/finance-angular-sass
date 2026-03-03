import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import { ToastService } from '../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { ConsentService } from '../../core/services/consent.service';
import { LegalConsentProofService } from '../../core/services/legal-consent-proof.service';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../../core/config/firebase.config';

@Component({
  selector: 'app-register',
  imports: [FormsModule, InputComponent, Button],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  acceptedLegal = signal(false);
  loading = signal(false);
  private returnUrl = '/app/billing';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private consentService: ConsentService,
    private legalConsentProofService: LegalConsentProofService,
    private route: ActivatedRoute,
  ) {
    const requestedReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (requestedReturnUrl && requestedReturnUrl.startsWith('/')) {
      this.returnUrl = requestedReturnUrl;
    }
  }
  async register() {
    if (this.loading()) return;

    const email = this.email().trim().toLowerCase();

    if (!this.name() || !email || !this.password() || !this.confirmPassword()) {
      this.toastService.show('Por favor, preencha todos os campos.', 'error');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.toastService.show('As senhas não coincidem.', 'error');
      return;
    }
    if (!this.acceptedLegal()) {
      this.toastService.show(
        'Você precisa aceitar a Política de Privacidade e os Termos.',
        'error',
      );
      return;
    }

    this.loading.set(true);
    try {
      const credential = await firstValueFrom(this.authService.register(email, this.password()));

      await setDoc(
        doc(firestore, `users/${credential.user.uid}`),
        {
          uid: credential.user.uid,
          email,
          name: this.name().trim(),
          pixAccessGranted: false,
          pixPaymentRequested: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      this.consentService.acceptCurrentPolicy(credential.user.uid);

      try {
        await this.legalConsentProofService.recordCoreLegalAcceptance(
          credential.user.uid,
          'register_checkbox',
        );
      } catch (proofError) {
        console.error('Falha ao salvar prova de consentimento no Firebase:', proofError);
      }

      this.toastService.show('Registro bem-sucedido!', 'success');
      this.router.navigateByUrl(this.returnUrl);
    } catch (error) {
      this.toastService.show(this.getRegisterErrorMessage(error), 'error');
      return;
    } finally {
      this.loading.set(false);
    }
  }

  private getRegisterErrorMessage(error: any): string {
    const errorCode = error?.code || '';

    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este email já está cadastrado. Faça login ou use outro email.';
      case 'auth/invalid-email':
        return 'Email inválido.';
      case 'auth/weak-password':
        return 'Senha muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      default:
        return 'Erro ao registrar. Tente novamente.';
    }
  }

  goToLogin() {
    this.router.navigate(['/app/login'], {
      queryParams: { returnUrl: this.returnUrl },
    });
  }

  goToPrivacy() {
    this.router.navigate(['privacy']);
  }

  goToTerms() {
    this.router.navigate(['terms']);
  }
}
