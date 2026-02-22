import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-enquiry-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './enquiry-dialog.html',
  styleUrl: './enquiry-dialog.scss'
})
export class EnquiryDialog implements OnInit {
  supabase = inject(SupabaseService);

  enquiry: any = { name: '', phone: '', source: '', destination: '', car: null, date: null, time: '' };

  isSubmitting = false;
  dbLocations: string[] = [];
  fareMap: any = {};
  availableCars: any[] = [];

  sourceControl = new FormControl('');
  destControl = new FormControl('');
  filteredSources!: Observable<string[]>;
  filteredDestinations!: Observable<string[]>;

  minDate = new Date();

  constructor(
    public ref: MatDialogRef<EnquiryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngOnInit() {
    await this.loadDatabaseInfo();

    this.filteredSources = this.sourceControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );

    this.filteredDestinations = this.destControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  async loadDatabaseInfo() {
    try {
      // 1. Fetch Locations
      const { data: locationsData } = await this.supabase.supabase
        .from('maharashtra_locations')
        .select('city_name')
        .eq('is_active', true);

      if (locationsData) {
        this.dbLocations = [...new Set(locationsData.map(loc => loc.city_name))].sort();
      }

      // 2. Fetch Live Fleet (Cars & Specific Drivers)
      const { data: fleetData } = await this.supabase.supabase
        .from('fleet')
        .select('id, driver_id, name, type, rate_per_km, is_active')
        .eq('is_active', true);

      if (fleetData) {
        this.availableCars = fleetData.map(car => ({
          ...car,
          icon: car.type.includes('6') ? 'airport_shuttle' : 'directions_car'
        }));
      }

      // 3. Fetch Pilot Routes Pricing
      const { data: routesData } = await this.supabase.supabase
        .from('routes')
        .select('*');

      if (routesData) {
        routesData.forEach(route => {
          this.fareMap[route.dest.toLowerCase()] = {
            '4 Seater': route.price4,
            '6 Seater': route.price6,
            km: route.km,
            hasPackage: true
          };
        });
      }
    } catch (error) {
      console.error('Database fetch failed:', error);
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.dbLocations.filter(loc => loc.toLowerCase().includes(filterValue));
  }

  preventTyping(event: Event) {
    event.preventDefault();
  }

  openTimePicker(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && typeof target.showPicker === 'function') {
      try {
        target.showPicker();
      } catch (e) {
        target.click();
      }
    }
  }

  get bookingSummary() {
    const dest = this.destControl.value?.toLowerCase() || '';
    const selectedCar = this.enquiry.car;

    if (dest && selectedCar && this.fareMap[dest]) {
      const carTypeKey = selectedCar.type.includes('6') ? '6 Seater' : '4 Seater';

      const basePrice = this.fareMap[dest][carTypeKey];
      const isPackage = this.fareMap[dest].hasPackage;
      const discount = isPackage ? Math.floor(basePrice * 0.10) : 0;
      const finalPrice = basePrice - discount;

      return {
        price: `₹${finalPrice}/-`,
        originalPrice: isPackage ? `₹${basePrice}` : null,
        hasDiscount: isPackage,
        details: `${this.fareMap[dest].km} KM Limit | Extra ₹${selectedCar.rate_per_km}/km`,
        valid: true
      };
    }

    return { price: 'Select Valid Route', originalPrice: null, hasDiscount: false, details: 'Price unlocks when destination matches pilot routes', valid: false };
  }

  async submitBooking() {
    if (!this.bookingSummary.valid || !this.enquiry.car) return;

    try {
      this.isSubmitting = true;
      const { data: { user } } = await this.supabase.supabase.auth.getUser();

      // FIXED DATE LOGIC: Uses local time to prevent the day from shifting backwards
      const d = new Date(this.enquiry.date!);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const pickupDateTime = new Date(`${formattedDate}T${this.enquiry.time}`).toISOString();

      const bookingData = {
        customer_id: user?.id || null,
        driver_id: this.enquiry.car.driver_id,
        car_name: this.enquiry.car.name,
        source_location: this.sourceControl.value,
        destination_location: this.destControl.value,
        pickup_time: pickupDateTime,
        status: 'pending'
      };

      const { error } = await this.supabase.supabase.from('bookings').insert(bookingData);

      if (error) {
        console.error("Insert Error:", error.message);
        alert("Booking failed. Please try again.");
        return;
      }

      this.ref.close(true);

    } catch (error: any) {
      console.error(error);
      alert('Failed to book ride.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
