import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-notification-user',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule],
  templateUrl: './notification-user.html',
  styleUrls: ['./notification-user.scss']
})
export class NotificationUserComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID); // <-- Added PLATFORM_ID for SSR check

  isCustomer = false;
  userId = '';
  activeRides: any[] = [];

  // Track IDs the user has clicked "Dismiss" on
  private dismissedIds = new Set<string>();

  showNotifications = false;
  isLoading = false;
  private rideSubscription: any;

  async ngOnInit() {
    this.loadDismissedIds(); // Load previously dismissed notifications from browser memory
    await this.checkUserAccess();
  }

  ngOnDestroy() {
    if (this.rideSubscription) {
      this.supabase.supabase.removeChannel(this.rideSubscription);
    }
  }

  // Persist dismissed notifications across page reloads (SSR Safe)
  private loadDismissedIds() {
    if (isPlatformBrowser(this.platformId)) { // <-- SSR Check
      const saved = localStorage.getItem('dismissed_notifications');
      if (saved) {
        this.dismissedIds = new Set(JSON.parse(saved));
      }
    }
  }

  private saveDismissedIds() {
    if (isPlatformBrowser(this.platformId)) { // <-- SSR Check
      localStorage.setItem('dismissed_notifications', JSON.stringify(Array.from(this.dismissedIds)));
    }
  }

  async checkUserAccess() {
    // 🚀 SPEED BOOST: getSession checks local storage instantly.
    // It avoids the slow network request caused by getUser().
    const { data: { session } } = await this.supabase.supabase.auth.getSession();
    const user = session?.user;

    // Check if user is logged in and is NOT a driver
    if (user && user.user_metadata?.['role'] !== 'driver') {
      this.isCustomer = true;
      this.userId = user.id;

      // 🚀 SPEED BOOST: Removed 'await' so we don't block the UI thread.
      // Let it fetch in the background!
      this.loadNotifications();
      this.setupRealtimeListener();
    }
  }

  setupRealtimeListener() {
    this.rideSubscription = this.supabase.supabase
      .channel('user-notifications')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' },
        async (payload) => {
          const record = payload.new as any;
          if (record && record['customer_id'] === this.userId) {
            await this.loadNotifications();
          }
        }
      )
      .subscribe();
  }

  async loadNotifications() {
    if (!this.isCustomer || !this.userId) return;
    try {
      this.isLoading = true;

      // 🚀 ULTIMATE SPEED: One single network request using Supabase Joins.
      // This asks the database to match the profiles internally and send everything at once.
      const { data: bookings, error } = await this.supabase.supabase
        .from('bookings')
        .select(`
          *,
          profiles:driver_id(full_name, phone_number)
        `)
        .eq('customer_id', this.userId)
        .in('status', ['pending', 'accepted', 'rejected'])
        .order('pickup_time', { ascending: false });

      if (error) throw error;

      if (!bookings || bookings.length === 0) {
        this.activeRides = [];
        return;
      }

      // Map data AND filter out dismissed IDs in memory
      this.activeRides = bookings
        .filter(ride => !this.dismissedIds.has(ride.id))
        .map((ride: any) => ({
          ...ride,
          driver_name: ride.profiles?.full_name || 'Assigning Pilot...',
          driver_phone: ride.profiles?.phone_number || 'Standby'
        }));

    } catch (error) {
      console.error('Fetch error in User Notifications:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Mark as Read / Dismiss
  dismissNotification(rideId: string, event: Event) {
    event.stopPropagation(); // Prevent the dropdown panel from accidentally closing

    this.dismissedIds.add(rideId);
    this.saveDismissedIds(); // Save to localStorage

    this.activeRides = this.activeRides.filter(r => r.id !== rideId);

    if (this.activeRides.length === 0) {
      this.showNotifications = false;
    }

    this.cdr.detectChanges();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;

  }
}
