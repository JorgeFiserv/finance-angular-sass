import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import { ToastService } from '../../core/services/toast.service';

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
  loading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {}
  async register() {
    if (!this.name() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.toastService.show('Por favor, preencha todos os campos.', 'error');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.toastService.show('As senhas não coincidem.', 'error');
      return;
    }
    this.loading.set(true);
    try {
      await this.authService.register(this.email(), this.password());
      this.toastService.show('Registro bem-sucedido! Faça login para continuar.', 'success');
      this.router.navigate(['login']);
    } catch (error) {
      this.toastService.show('Erro ao registrar: ' + (error as Error).message, 'error');
      return;
    } finally {
      this.loading.set(false);
    }
  }
  goToLogin() {
    this.router.navigate(['login']);
  }
}
