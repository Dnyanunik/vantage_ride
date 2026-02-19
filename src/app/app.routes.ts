import { Routes } from '@angular/router';

export const routes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', loadComponent: () => import('./components/home/home').then(m => m.HomeComponent)},
  {path: 'services', loadComponent: () => import('./components/service/service').then(m => m.Service)},
  {path: 'about', loadComponent: () => import('./components/about/about').then(m => m.About)},
];
