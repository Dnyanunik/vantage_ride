import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // 🔴 Added isPlatformBrowser
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../theme';
import { SupabaseService } from '../../services/supabase';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIcon, RouterModule, MatProgressBarModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  themeService = inject(ThemeService);
  supabase = inject(SupabaseService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  // 🔴 Get the current platform (Server or Browser)
  platformId = inject(PLATFORM_ID);

  phoneNumber1 = '+8669113136';
  email = 'dnyaneshwarn727@gmail.com';

  cars: any[] = [];
  pilotRoutes: any[] = [];
  isLoadingCars = true;
  isLoadingRoutes = true;

  async ngOnInit() {
    // 🔴 Check if we are in the browser
    const isBrowser = isPlatformBrowser(this.platformId);

    // 🚀 STEP 1: INSTANT CACHE CHECK (Only in Browser)
    if (isBrowser) {
      const cachedCars = sessionStorage.getItem('swiftlux_cars');
      const cachedRoutes = sessionStorage.getItem('swiftlux_routes');

      if (cachedCars && cachedRoutes) {
        this.cars = JSON.parse(cachedCars);
        this.pilotRoutes = JSON.parse(cachedRoutes);
        this.isLoadingCars = false;
        this.isLoadingRoutes = false;
        this.cdr.detectChanges();
        console.log('⚡ Loaded from Local Cache instantly!');
      }
    }

    // 🚀 STEP 2: SILENT BACKGROUND FETCH
    try {
      const [carsResult, routesResult] = await Promise.all([
        this.supabase.getVehicles().catch((err: any) => {
          console.error('🚗 Fleet Error:', err);
          return [];
        }),

        (async () => {
          const { data, error } = await this.supabase.supabase
            .from('routes')
            .select('*')
            .order('dest', { ascending: true });

          if (error) {
            console.error('🗺️ Route DB Error:', error);
            return [];
          }
          return data || [];
        })()
      ]);

      this.cars = carsResult || [];
      this.pilotRoutes = routesResult;

      // 🚀 STEP 3: UPDATE THE CACHE FOR NEXT TIME (Only in Browser)
      if (isBrowser) {
        sessionStorage.setItem('swiftlux_cars', JSON.stringify(this.cars));
        sessionStorage.setItem('swiftlux_routes', JSON.stringify(this.pilotRoutes));
      }

    } catch (error: any) {
      console.error('Critical Fetch Error:', error);
    } finally {
      // 🚀 STEP 4: WAKE UP ANGULAR
      setTimeout(() => {
        this.isLoadingCars = false;
        this.isLoadingRoutes = false;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  makeCall() { window.location.href = `tel:${this.phoneNumber1}`; }
  sendEmail() { window.location.href = `mailto:${this.email}`; }

  async bookRide(itemName: string) {
    const user = await this.supabase.getCurrentUser();
    if (!user) {
      alert('Please log in to book your ride.');
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/book-ride'], { queryParams: { item: itemName } });
  }
  scrollToFleet() {
    const fleetSection = document.getElementById('fleet-section');
    if (fleetSection) {
      fleetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
