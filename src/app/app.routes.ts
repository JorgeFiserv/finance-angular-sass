import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { SubscriptionGuard } from './core/guards/subscription.guard';
import { Layout } from './shared/components/layout/layout';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
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
    path: 'app/login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'app/register',
    loadComponent: () => import('./features/register/register').then((m) => m.Register),
  },
  // Rotas com layout (área logada)
  {
    path: 'app',
    component: Layout,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'billing',
        loadComponent: () => import('./features/billing/billing').then((m) => m.Billing),
      },
      {
        path: 'overview',
        canActivate: [SubscriptionGuard],
        loadComponent: () =>
          import('./features/overview/overview').then((m) => m.OverviewComponent),
      },
      {
        path: 'transactions',
        canActivate: [SubscriptionGuard],
        loadComponent: () =>
          import('./features/transactions/transactions').then((m) => m.TransactionsListComponent),
      },
      {
        path: 'budgets',
        canActivate: [SubscriptionGuard],
        loadComponent: () => import('./features/budgets/budgets').then((m) => m.Budgets),
      },
      {
        path: 'pots',
        canActivate: [SubscriptionGuard],
        loadComponent: () => import('./features/pots/pots').then((m) => m.PotsComponent),
      },
      {
        path: 'recurring-bills',
        canActivate: [SubscriptionGuard],
        loadComponent: () =>
          import('./features/recurring-bills/recurring-bills').then((m) => m.RecurringBills),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
