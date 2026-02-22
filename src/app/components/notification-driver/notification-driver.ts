import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-notification-driver',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule],
  templateUrl: './notification-driver.html',
  styleUrls: ['./notification-driver.scss']
})
export class NotificationDriverComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  isDriver = false;
  driverId = '';

  pendingRequests: any[] = [];
  showNotifications = false;
  isLoading = false;
  private rideSubscription: any;

  async ngOnInit() {
    await this.checkDriverAccess();
  }

  ngOnDestroy() {
    if (this.rideSubscription) {
      this.supabase.supabase.removeChannel(this.rideSubscription);
    }
  }

  async checkDriverAccess() {
    const { data: { user } } = await this.supabase.supabase.auth.getUser();

    if (user && user.user_metadata?.['role'] === 'driver') {
      this.isDriver = true;
      this.driverId = user.id;

      await this.loadNotifications();
      this.setupRealtimeListener();
    }
  }

  setupRealtimeListener() {
    this.rideSubscription = this.supabase.supabase
      .channel('driver-notifications')
      // Listen to both INSERT (new ride) and UPDATE (user cancels ride)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
        async (payload) => {
          const record = payload.new as any;

          // Only react if this ride involves THIS driver
          if (record && record['driver_id'] === this.driverId) {
            // Re-fetch to ensure we get the joined passenger profile data!
            await this.loadNotifications();
            this.cdr.detectChanges(); // Force Angular to update the bell icon count instantly
          }
        }
      )
      .subscribe();
  }

  async loadNotifications() {
    if (!this.isDriver || !this.driverId) return;
    try {
      this.isLoading = true;
      const data = await this.supabase.getPendingRidesForDriver(this.driverId);

      // 🔴 Fetching User Name and Contact safely (Adapted from your my-rides logic)
      this.pendingRequests = (data || []).map((ride: any) => ({
        ...ride,
        // Checks direct property, then customer join, then profiles join, defaults to Unknown
        user_name: ride.user_name || ride.customer?.full_name || ride.profiles?.full_name || 'Unknown Passenger',
        // Checks direct property, then customer join, then profiles join, defaults to N/A
        user_phone: ride.user_phone || ride.customer?.phone_number || ride.profiles?.phone_number || 'N/A'
      }));

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  async acceptRide(bookingId: string) {
    try {
      // 1. Update database
      await this.supabase.updateBookingStatus(bookingId, 'accepted');

      // 2. Instantly remove from pending list UI
      this.pendingRequests = this.pendingRequests.filter(req => req.id !== bookingId);
      if (this.pendingRequests.length === 0) this.showNotifications = false;

      alert('Mission Accepted! Check your Driver History to track it.');
    } catch (error) {
      alert('Error accepting mission. Please try again.');
    }
  }

  async rejectRide(bookingId: string) {
    const confirmReject = confirm("Are you sure you want to reject this mission?");
    if (!confirmReject) return;

    try {
      // 1. Update database to rejected
      await this.supabase.updateBookingStatus(bookingId, 'rejected');

      // 2. Instantly remove from pending list UI
      this.pendingRequests = this.pendingRequests.filter(req => req.id !== bookingId);
      if (this.pendingRequests.length === 0) this.showNotifications = false;

    } catch (error) {
      alert('Error rejecting mission.');
    }
  }
}
