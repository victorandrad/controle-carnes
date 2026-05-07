import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { campanhaGuard } from './shared/guards/campanha.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'selecionar-campanha',
    canActivate: [authGuard],
    loadComponent: () => import('./campanhas/selecionar-campanha.component').then(m => m.SelecionarCampanhaComponent),
  },
  {
    path: 'campanhas',
    canActivate: [authGuard],
    loadComponent: () => import('./campanhas/campanhas-list.component').then(m => m.CampanhasListComponent),
  },
  {
    path: '',
    canActivate: [authGuard, campanhaGuard],
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'participantes', loadComponent: () => import('./participantes/participantes-list.component').then(m => m.ParticipantesListComponent) },
      { path: 'carnes',        loadComponent: () => import('./carnes/carnes-venda.component').then(m => m.CarnesVendaComponent) },
      { path: 'pagamentos',    loadComponent: () => import('./pagamentos/pagamentos.component').then(m => m.PagamentosComponent) },
      { path: 'relatorios',    loadComponent: () => import('./relatorios/relatorios.component').then(m => m.RelatoriosComponent) },
      { path: '', redirectTo: 'participantes', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
