import { Component, signal, inject, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from '../../models/MenuItem.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private router = inject(Router);
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  readonly menuItems: MenuItem[] = [
    { label: 'Visão geral', icon: 'dashboard', route: '/overview' },
    { label: 'Transações', icon: 'swap_horiz', route: '/transactions' },
    { label: 'Orçamentos', icon: 'pie_chart', route: '/budgets' },
    { label: 'Cofres', icon: 'account_balance_wallet', route: '/pots' },
    { label: 'Contas Recorrentes', icon: 'repeat', route: '/recurring-bills' },
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
}
