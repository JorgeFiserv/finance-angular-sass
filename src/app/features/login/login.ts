import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, InputComponent, Button],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = signal('');
  password = signal('');
  loading = signal(false);
  private returnUrl = '/app/overview';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {
    const requestedReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (requestedReturnUrl && requestedReturnUrl.startsWith('/')) {
      this.returnUrl = requestedReturnUrl;
    }
  }

  async login() {
    if (!this.email() || !this.password()) {
      this.toastService.show('Por favor, preencha todos os campos.', 'error');
      return;
    }
    this.loading.set(true);
    this.authService.login(this.email(), this.password()).subscribe({
      next: () => {
        this.toastService.show('Login bem-sucedido!', 'success');
        this.router.navigateByUrl(this.returnUrl);
        this.loading.set(false);
      },
      error: (error) => {
        const errorMessage = this.getErrorMessage(error);
        this.toastService.show(errorMessage, 'error');
        this.loading.set(false);
      },
    });
  }

  private getErrorMessage(error: any): string {
    const errorCode = error?.code || '';

    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email ou senha incorretos.';
      case 'auth/invalid-email':
        return 'Email inválido.';
      case 'auth/user-disabled':
        return 'Usuário desativado.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet.';
      default:
        return 'Erro ao fazer login. Tente novamente.';
    }
  }

  goToRegister() {
    this.router.navigate(['/app/register'], {
      queryParams: { returnUrl: this.returnUrl },
    });
  }
}
