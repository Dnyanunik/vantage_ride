import { Component, OnInit, OnDestroy, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-my-rides',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './my-rides.html',
  styleUrls: ['./my-rides.scss']
})
export class MyRidesComponent implements OnInit, OnDestroy {
  supabase = inject(SupabaseService);
  cdr = inject(ChangeDetectorRef);

  bookings: any[] = [];
  isLoading = true;
  isOffline = !navigator.onLine;
  isDriver = false;
  userId = '';

  private historySubscription: any;

  @HostListener('window:offline', ['$event'])
  onOffline(event: Event) {
    this.isOffline = true;
    this.cdr.detectChanges();
  }

  @HostListener('window:online', ['$event'])
  onOnline(event: Event) {
    this.isOffline = false;
    this.loadHistory();
  }

  async ngOnInit() {
    await this.loadHistory();
    this.setupRealtimeListener();
  }

  ngOnDestroy() {
    if (this.historySubscription) {
      this.supabase.supabase.removeChannel(this.historySubscription);
    }
  }

  // 🔴 Listen for any status changes dynamically
  setupRealtimeListener() {
    this.historySubscription = this.supabase.supabase
      .channel('history-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        const updatedRide = payload.new as any;

        // Update local array if the ride exists in our list
        const index = this.bookings.findIndex(b => b.id === updatedRide.id);
        if (index !== -1) {
          this.bookings[index] = { ...this.bookings[index], ...updatedRide };
          this.cdr.detectChanges();
        }
      })
      .subscribe();
  }

  async loadHistory() {
    if (this.isOffline) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      this.isLoading = true;
      const { data: { user } } = await this.supabase.supabase.auth.getUser();

      if (user) {
        this.userId = user.id;
        this.isDriver = user.user_metadata?.['role'] === 'driver';

        // 🔴 IMPORTANT: Ensure your supabase service actually selects user_name and user_phone
        // Example: .select('*, profiles(name, phone)')
        let data = [];
        if (this.isDriver) {
          data = await this.supabase.getDriverBookings(this.userId);
        } else {
          data = await this.supabase.getMyBookings();
        }

        // Map data to ensure name/phone exist even if they come from a joined table
        this.bookings = (data || []).map(ride => ({
          ...ride,
          user_name: ride.user_name || ride.profiles?.name || 'Unknown Passenger',
          user_phone: ride.user_phone || ride.profiles?.phone || 'No Phone Provided'
        }));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async cancelRide(bookingId: string) {
    if (this.isOffline) return alert('No internet connection! Cannot cancel ride.');

    const confirmCancel = confirm('Are you sure you want to cancel this ride?');
    if (!confirmCancel) return;

    try {
      this.isLoading = true;
      await this.supabase.updateBookingStatus(bookingId, 'cancelled');

      // The real-time listener will pick this up, but we can also update locally for speed
      const index = this.bookings.findIndex(b => b.id === bookingId);
      if (index !== -1) this.bookings[index].status = 'cancelled';

      alert('Mission aborted successfully.');
    } catch (error) {
      alert('Failed to cancel the ride. Ensure you have database permissions.');
      console.error(error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async markAsCompleted(bookingId: string) {
    if (this.isOffline) return alert('No internet connection! Cannot update status.');

    const confirmComplete = confirm('Did you successfully complete this mission?');
    if (!confirmComplete) return;

    try {
      this.isLoading = true;
      await this.supabase.updateBookingStatus(bookingId, 'completed');

      const index = this.bookings.findIndex(b => b.id === bookingId);
      if (index !== -1) this.bookings[index].status = 'completed';

      alert('Mission Accomplished!');
    } catch (error) {
      alert('Failed to update database. Check Supabase RLS policies.');
      console.error(error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
