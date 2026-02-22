import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // 🔴 1. Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-pilot-routes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, MatProgressSpinnerModule],
  templateUrl: './pilot-routes.html',
  styleUrls: ['./pilot-routes.scss']
})
export class PilotRoutesComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef); // 🔴 2. Inject it

  isDriver = false;
  isLoading = true;
  errorMessage = '';

  newRoute = {
    dest: '',
    km: '',
    price4: null as number | null,
    price6: null as number | null
  };

  activeRoutes: any[] = [];

  async ngOnInit() {
    this.isLoading = true;

    // 🚀 SPEED BOOST: Check auth and fetch routes at the exact same time!
    await Promise.all([
      this.checkAccess(),
      this.loadActiveRoutes()
    ]);

    this.isLoading = false;
    this.cdr.detectChanges(); // 🔴 3. WAKE UP ANGULAR! Hide spinner instantly.
  }

  async checkAccess() {
    try {
      const { data: { user } } = await this.supabase.supabase.auth.getUser();
      if (user && user.user_metadata?.['role'] === 'driver') {
        this.isDriver = true;
      }
    } catch (err) {
      console.error('Auth Check Error:', err);
    }
  }

  async loadActiveRoutes() {
    this.errorMessage = '';

    if (!navigator.onLine) {
      this.errorMessage = 'Network disconnected. Please check your internet connection.';
      return;
    }

    try {
      const { data, error } = await this.supabase.supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Table Sync Error:', error.message);
        this.errorMessage = 'Failed to sync routes. The database might be unreachable.';
      } else {
        this.activeRoutes = data || [];
      }
    } catch (err) {
      console.error('Network Error:', err);
      this.errorMessage = 'A network error occurred. Please check your connection and try again.';
    }
  }

  async broadcastRoute() {
    if (!this.newRoute.dest || !this.newRoute.km || !this.newRoute.price4 || !this.newRoute.price6) {
      alert("Mission parameters incomplete: Destination, KM, and both prices are required.");
      return;
    }

    const routeData = {
      dest: this.newRoute.dest,
      km: this.newRoute.km.toString(),
      price4: this.newRoute.price4,
      price6: this.newRoute.price6
    };

    const { data, error } = await this.supabase.supabase
      .from('routes')
      .insert([routeData])
      .select();

    if (error) {
      alert("Broadcast failed. Check database connection.");
      console.error(error);
    } else {
      if (data) {
        this.activeRoutes.unshift(data[0]);
        this.cdr.detectChanges(); // 🔴 Instantly show new route on screen!
      }
      this.resetForm();
    }
  }

  async deleteRoute(routeId: string, index: number) {
    if (confirm('Are you sure you want to delete this route?')) {
      const { error } = await this.supabase.supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

      if (!error) {
        this.activeRoutes.splice(index, 1);
        this.cdr.detectChanges(); // 🔴 Instantly remove route from screen!
      } else {
        alert("Action denied: Unable to delete route. Check console for details.");
        console.error(error);
      }
    }
  }

  resetForm() {
    this.newRoute = { dest: '', km: '', price4: null, price6: null };
  }

  bookCustomRoute(route: any) {
    console.log("Engaging route:", route.id);
    alert(`Initiating transfer to ${route.dest}`);
  }
}
