import { Routes } from '@angular/router';
import { environment } from '@env';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

const defaultRoute = environment.devBypassAuth ? 'app/home' : 'auth/welcome';

export const routes: Routes = [
  { path: '', redirectTo: defaultRoute, pathMatch: 'full' },

  // Auth routes (unguarded)
  {
    path: 'auth',
    children: [
      { path: 'welcome', loadComponent: () => import('./features/auth/welcome/welcome.component') },
      { path: 'sign-in', loadComponent: () => import('./features/auth/sign-in/sign-in.component') },
      { path: 'sign-up', loadComponent: () => import('./features/auth/sign-up/sign-up.component') },
    ]
  },

  // App routes (guarded)
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./layout/tab-layout/tab-layout.component'),
        children: [
          { path: 'home', loadComponent: () => import('./features/home/home.component') },
          { path: 'rides', loadComponent: () => import('./features/rides/rides.component') },
          { path: 'chat', loadComponent: () => import('./features/chat/chat.component') },
          { path: 'profile', loadComponent: () => import('./features/profile/profile.component') },
          { path: '', redirectTo: 'home', pathMatch: 'full' },
        ]
      },
      { path: 'find-ride', loadComponent: () => import('./features/ride-flow/find-ride/find-ride.component') },
      { path: 'confirm-ride', loadComponent: () => import('./features/ride-flow/confirm-ride/confirm-ride.component') },
      { path: 'book-ride', loadComponent: () => import('./features/ride-flow/book-ride/book-ride.component') },
    ]
  },

  // Admin routes (admin guard)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout.component'),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component') },
      { path: 'drivers', loadComponent: () => import('./features/admin/drivers/admin-drivers.component') },
      { path: 'rides', loadComponent: () => import('./features/admin/rides/admin-rides.component') },
      { path: 'users', loadComponent: () => import('./features/admin/users/admin-users.component') },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  { path: '**', redirectTo: defaultRoute }
];
