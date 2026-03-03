import { Component, signal, inject, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from '../../models/MenuItem.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmModal } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ConfirmModal],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private router = inject(Router);
  private authService = inject(AuthService);
  isLogoutModalOpen = signal(false);
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  readonly menuItems: MenuItem[] = [
    { label: 'Pagamento PIX', icon: 'qr_code_2', route: '/app/billing' },
    { label: 'Visão geral', icon: 'dashboard', route: '/app/overview' },
    { label: 'Transações', icon: 'swap_horiz', route: '/app/transactions' },
    { label: 'Orçamentos', icon: 'pie_chart', route: '/app/budgets' },
    { label: 'Cofres', icon: 'account_balance_wallet', route: '/app/pots' },
    { label: 'Contas Recorrentes', icon: 'repeat', route: '/app/recurring-bills' },
  ];

  goTo(route: string): void {
    console.log('Navegando para:', route);
    this.router
      .navigate([route])
      .then((success) => {
        console.log('Navegação bem-sucedida:', success);
      })
      .catch((err) => {
        console.error('Erro na navegação:', err);
      });
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  logout(): void {
    this.isLogoutModalOpen.set(true);
  }

  cancelLogout(): void {
    this.isLogoutModalOpen.set(false);
  }

  confirmLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.isLogoutModalOpen.set(false);
        this.router.navigate(['/app/login']);
      },
      error: (err) => {
        console.error('Erro ao sair da conta:', err);
        this.isLogoutModalOpen.set(false);
      },
    });
  }
}
