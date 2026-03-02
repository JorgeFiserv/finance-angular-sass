import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { Layout } from './shared/components/layout/layout';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/legal/privacy/privacy').then((m) => m.Privacy),
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/legal/terms/terms').then((m) => m.Terms),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register').then((m) => m.Register),
  },
  // Rotas com layout (área logada)
  {
    path: '',
    component: Layout,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/overview/overview').then((m) => m.OverviewComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions').then((m) => m.TransactionsListComponent),
      },
      {
        path: 'budgets',
        loadComponent: () => import('./features/budgets/budgets').then((m) => m.Budgets),
      },
      {
        path: 'pots',
        loadComponent: () => import('./features/pots/pots').then((m) => m.PotsComponent),
      },
      {
        path: 'recurring-bills',
        loadComponent: () =>
          import('./features/recurring-bills/recurring-bills').then((m) => m.RecurringBills),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'overview',
  },
];
