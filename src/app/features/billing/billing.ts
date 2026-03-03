import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { auth, firestore } from '../../core/config/firebase.config';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [],
  templateUrl: './billing.html',
  styleUrl: './billing.scss',
})
export class Billing {
  private toastService = inject(ToastService);
  private router = inject(Router);
  private readonly pixKey =
    '00020101021126580014br.gov.bcb.pix0136efc7bd5e-a855-409c-9ccc-891a584b0e8e520400005303986540512.905802BR5913JORGE L ATTIE6009SAO PAULO62070503***630438B7';
  readonly qrImagePath = 'assets/images/pix/pix.png';

  copying = signal(false);
  requestingReview = signal(false);
  paymentConfirmed = signal(false);

  constructor() {
    void this.refreshAccessStatus();
  }

  getPixKey(): string {
    return this.pixKey;
  }

  async copyPixKey(): Promise<void> {
    if (this.copying()) return;

    this.copying.set(true);
    try {
      await navigator.clipboard.writeText(this.pixKey);
      this.toastService.success('Chave PIX copiada!');
    } catch (error) {
      this.toastService.error('Não foi possível copiar a chave PIX.');
    } finally {
      this.copying.set(false);
    }
  }

  async confirmPixPayment(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      this.toastService.error('Faça login para solicitar a liberação do acesso.');
      return;
    }

    this.requestingReview.set(true);
    try {
      await setDoc(
        doc(firestore, `users/${user.uid}`),
        {
          pixPaymentRequestedAt: serverTimestamp(),
          pixPaymentRequested: true,
        },
        { merge: true },
      );

      this.toastService.success('Recebemos sua solicitação. Aguarde a liberação no sistema.');
      await this.refreshAccessStatus();
    } catch (error) {
      this.toastService.error('Não foi possível registrar sua solicitação agora.');
    } finally {
      this.requestingReview.set(false);
    }
  }

  async refreshAccessStatus(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      this.paymentConfirmed.set(false);
      return;
    }

    try {
      const snapshot = await getDoc(doc(firestore, `users/${user.uid}`));
      const hasPaidAccess = snapshot.exists() && snapshot.data()?.['pixAccessGranted'] === true;
      this.paymentConfirmed.set(hasPaidAccess);
    } catch (error) {
      this.paymentConfirmed.set(false);
    }
  }

  goToApp(): void {
    this.router.navigate(['/app/overview']);
  }
}
