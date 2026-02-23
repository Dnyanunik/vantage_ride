import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { LoaderComponent } from './components/loader/loader';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { SupabaseService } from './services/supabase';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoaderComponent, Navbar, RouterOutlet, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  isAppStarting: boolean = true;

  // Modern Angular Injection
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef); // 👈 Added this to force UI updates

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {

      try {
        // 1. Check if the user is already logged in
        const { data: { session } } = await this.supabase.supabase.auth.getSession();

        if (session) {
          // ✅ USER IS LOGGED IN: Kill the loader instantly
          this.isAppStarting = false;
          this.cdr.detectChanges(); // 👈 FORCES Angular to remove the loader right now

          if (this.router.url !== '/home') {
            this.router.navigate(['/home']);
          }
        } else {
          // ❌ NO USER: Run standard loader logic
          const hasSeenLoader = sessionStorage.getItem('app_initialized');
          if (hasSeenLoader === 'true') {
            this.isAppStarting = false;
          }
          this.cdr.detectChanges(); // Update UI
        }
      } catch (error) {
        console.error("Supabase session check failed:", error);
        this.isAppStarting = false; // Failsafe: hide loader if DB check crashes
        this.cdr.detectChanges();
      }

    } else {
      // On Server (SSR/Prerendering)
      this.isAppStarting = false;
    }
  }

  onLoadingComplete() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('app_initialized', 'true');
    }
    this.isAppStarting = false;
    this.cdr.detectChanges(); // 👈 Force update here too just in case
  }
}
