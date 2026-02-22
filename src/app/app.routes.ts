import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest-guard';

export const routes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', loadComponent: () => import('./components/home/home').then(m => m.HomeComponent)},
  {path: 'services', loadComponent: () => import('./components/service/service').then(m => m.Service)},
  {path: 'about', loadComponent: () => import('./components/about/about').then(m => m.About)},
  {
  path: 'login',
  loadComponent: () => import('./components/login/login').then(m => m.Login),
  canActivate: [guestGuard]
},
  {path:'signup', loadComponent: () => import('./components/signup/signup').then(m => m.Signup)},
  {path: 'profile', loadComponent: () => import('./components/profile/profile').then(m => m.ProfileComponent)},
  {path:'manage-fleet', loadComponent: () => import('./components/manage-fleet/manage-fleet').then(m => m.ManageFleetComponent)},
{path: 'book-ride', loadComponent: () => import('./components/book-ride/book-ride').then(m => m.BookRideComponent)},
{path: 'my-rides', loadComponent: () => import('./components/my-rides/my-rides').then(m => m.MyRidesComponent)},
{path: 'pilot-routes', loadComponent: () => import('./components/pilot-routes/pilot-routes').then(m => m.PilotRoutesComponent)},
];
