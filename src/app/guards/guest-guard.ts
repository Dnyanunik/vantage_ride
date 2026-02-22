import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

export const guestGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabase.getCurrentUser();

  if (user) {
    // If logged in, redirect home and block the login route
    return router.parseUrl('/');
  }

  return true;
};
