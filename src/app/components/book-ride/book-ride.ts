import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';


@Component({
  selector: 'app-book-ride',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-ride.html',
  styleUrls: ['./book-ride.scss']
})
export class BookRideComponent implements OnInit {
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  supabase = inject(SupabaseService);
  platformId = inject(PLATFORM_ID);

  bookingForm!: FormGroup;

  selectedCar: string = 'Premium Fleet';
  driverId: string | null = null;
  customerId: string | null = null;

  isSubmitting = false;
  isLoadingLocations = true;

  allLocations: any[] = [];
  districts: string[] = [];
  availableSourceCities: any[] = [];
  availableDestCities: any[] = [];

  ngOnInit() {
    // 1. Instantly grab route params
    this.route.queryParams.subscribe(params => {
      if (params['car']) this.selectedCar = params['car'];
      if (params['driver_id']) this.driverId = params['driver_id'];
    });

    // 2. Instantly build the form
    this.bookingForm = this.fb.group({
      sourceDistrict: ['', Validators.required],
      sourceCity: [{ value: '', disabled: true }, Validators.required],
      destinationDistrict: ['', Validators.required],
      destinationCity: [{ value: '', disabled: true }, Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required]
    });

    // 3. Instantly attach listeners (Before data arrives!)
    this.setupFormListeners();

    // 4. Fire off network requests in the background (Notice: NO 'await')
    // This allows the UI to render immediately without waiting for the DB.
    this.initializeData();
  }

  // Separated for cleaner code
  private setupFormListeners() {
    this.bookingForm.get('sourceDistrict')?.valueChanges.subscribe(selectedDistrict => {
      if (!selectedDistrict) return;
      this.availableSourceCities = this.allLocations.filter(loc => loc.district === selectedDistrict);
      this.bookingForm.get('sourceCity')?.enable();
      this.bookingForm.get('sourceCity')?.setValue('');
    });

    this.bookingForm.get('destinationDistrict')?.valueChanges.subscribe(selectedDistrict => {
      if (!selectedDistrict) return;
      this.availableDestCities = this.allLocations.filter(loc => loc.district === selectedDistrict);
      this.bookingForm.get('destinationCity')?.enable();
      this.bookingForm.get('destinationCity')?.setValue('');
    });
  }

  // Runs concurrently without blocking OnInit
  private initializeData() {
    Promise.all([
      this.loadLocations(),
      this.fetchCurrentUser()
    ]).catch(err => console.error("Initialization error:", err));
  }

  async fetchCurrentUser() {
    const { data: { session } } = await this.supabase.supabase.auth.getSession();
    this.customerId = session?.user?.id || null;
  }
async loadLocations() {
    try {
      this.isLoadingLocations = true;

      // Start a timer to see exactly how long this takes
      console.time('Location Fetch Time');

      // 1. Check if we already have the locations saved in the browser
      const cachedLocations = localStorage.getItem('vantage_locations_cache');

      if (cachedLocations) {
        // FAST PATH: Load from browser memory instantly
        console.log('⚡ Loaded locations from local cache instantly!');
        this.allLocations = JSON.parse(cachedLocations);
      } else {
        // SLOW PATH: Fetch from Supabase (Only happens once)
        console.log('☁️ Fetching from Supabase... this may take a moment.');
        this.allLocations = await this.supabase.getLocations();

        // Save it to the browser for next time!
        try {
          localStorage.setItem('vantage_locations_cache', JSON.stringify(this.allLocations));
        } catch (storageError) {
          console.warn('Payload too large for LocalStorage', storageError);
        }
      }

      // 2. Extract and sort unique districts
      const rawDistricts = this.allLocations.map(loc => loc.district);
      this.districts = [...new Set(rawDistricts)].sort();

      console.timeEnd('Location Fetch Time'); // Stop the timer

    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      this.isLoadingLocations = false;
    }
  }

  async onSubmit() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched(); // Highlights errors for the user instantly
      alert('Please fill out all fields completely.');
      return;
    }

    if (!this.driverId) {
       alert('Error: No driver selected. Please return to the fleet page and select a car again.');
       return;
    }

    if (!this.customerId) {
       alert('Error: You must be logged in to book a ride.');
       this.router.navigate(['/login']);
       return;
    }

    try {
      this.isSubmitting = true;

      const formValues = this.bookingForm.getRawValue();
      const pickupDateTime = new Date(`${formValues.date}T${formValues.time}`).toISOString();

      const bookingData = {
        customer_id: this.customerId,
        driver_id: this.driverId,
        car_name: this.selectedCar,
        source_location: `${formValues.sourceCity}, ${formValues.sourceDistrict}`,
        destination_location: `${formValues.destinationCity}, ${formValues.destinationDistrict}`,
        pickup_time: pickupDateTime,
        status: 'pending'
      };

      const { error } = await this.supabase.supabase.from('bookings').insert(bookingData);

      if (error) {
        console.error("Insert Error:", error.message);
        alert("Booking failed. Please check the console.");
        return;
      }

      alert('Ride requested directly to the pilot! Awaiting their confirmation.');
      this.router.navigate(['/']);

    } catch (error: any) {
      console.error(error);
      alert('Failed to book ride. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
