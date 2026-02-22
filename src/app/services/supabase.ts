import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Interfaces for Type Safety
export interface ProfileMetadata {
  full_name: string;
  username: string;
  phone_number: string;
  role: 'customer' | 'driver' | 'admin';
}

export interface DriverRegistration {
  id: string;
  license_number: string;
  vehicle_model: string;
  vehicle_plate: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  /* ========================================= */
  /* === AUTHENTICATION & SESSION (FAST) === */
  /* ========================================= */

  async signUp(email: string, pass: string, metadata: ProfileMetadata) {
    try {
      const response = await this.supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      if (response.error) throw response.error;
      return response;
    } catch (error) {
      console.error('Auth Signup Error:', error);
      throw error;
    }
  }

  async signIn(email: string, pass: string) {
    return await this.supabase.auth.signInWithPassword({ email, password: pass });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // 🚀 SPEED BOOST: We use getSession() instead of getUser().
  // getSession() reads from local memory instantly (0ms).
  // getUser() makes a slow network call to the server.
  async getCurrentUser(): Promise<User | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) {
      console.warn('Session check failed:', error.message);
      return null;
    }
    return session?.user || null;
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  }

  /* ========================================= */
  /* === USER PROFILES & DRIVER DETAILS ==== */
  /* ========================================= */

  async getUserProfile() {
    const user = await this.getCurrentUser(); // Instantly gets local user
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('role, car_name')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  }

  async insertDriverDetails(details: DriverRegistration) {
    try {
      const { data, error } = await this.supabase
        .from('driver_details')
        .insert([details])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Database Insert Error (Driver):', error);
      throw error;
    }
  }

  async uploadAvatar(userId: string, file: File) {
    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) throw uploadError;

    // 🚀 SPEED BOOST: getPublicUrl is synchronous, no need to await it!
    const { data: urlData } = this.supabase.storage.from('avatars').getPublicUrl(filePath);
    const cleanUrl = urlData.publicUrl;

    const { error: dbError } = await this.supabase
      .from('profiles')
      .update({ avatar_url: cleanUrl })
      .eq('id', userId);

    if (dbError) throw dbError;
    return cleanUrl;
  }

  /* ========================================= */
  /* === FLEET MANAGEMENT (CARS) =========== */
  /* ========================================= */

  async getVehicles() {
    const { data, error } = await this.supabase
      .from('fleet')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 🚀 SPEED BOOST: Mapping URLs is instant and done locally.
    const carsWithImages = data?.map(car => {
      if (car.image_url && !car.image_url.startsWith('http')) {
        const { data: publicUrlData } = this.supabase
          .storage
          .from('fleet_images')
          .getPublicUrl('vehicles/' + car.image_url);
        car.image_url = publicUrlData.publicUrl;
      }
      return car;
    });

    return carsWithImages || [];
  }

  async addVehicleToFleet(vehicleData: any) {
    const user = await this.getCurrentUser(); // Fast check
    if (!user) throw new Error('Pilot not authorized.');

    const { data, error } = await this.supabase
      .from('fleet')
      .insert({
        driver_id: user.id,
        name: vehicleData.name,
        type: vehicleData.type,
        rate_per_km: vehicleData.rate,
        description: vehicleData.desc,
        min_package_km: vehicleData.minPkg,
        image_url: vehicleData.image,
        is_active: true
      });

    if (error) throw error;
    return data;
  }

  async uploadCarImageAndAddVehicle(vehicleData: any, file: File) {
    try {
      const user = await this.getCurrentUser(); // Fast check
      if (!user) throw new Error('Pilot not authorized.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `vehicles/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('fleet_images')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

      // 🚀 SPEED BOOST: Synchronous, instant URL generation
      const { data: publicUrlData } = this.supabase.storage
        .from('fleet_images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      const { data, error: dbError } = await this.supabase
        .from('fleet')
        .insert({
          driver_id: user.id,
          name: vehicleData.name,
          type: vehicleData.type,
          rate_per_km: vehicleData.rate,
          description: vehicleData.desc,
          min_package_km: vehicleData.minPkg,
          image_url: imageUrl,
          is_active: true
        });

      if (dbError) throw new Error('Image uploaded, but failed to save vehicle.');
      return data;
    } catch (error) {
      console.error('Transaction Failed:', error);
      throw error;
    }
  }

  /* ========================================= */
  /* === BOOKING LOGIC ===================== */
  /* ========================================= */

  async createBooking(bookingData: any) {
    const { data, error } = await this.supabase
      .from('bookings')
      .insert(bookingData)
      .select();

    if (error) throw error;
    return data;
  }

  async getMyBookings() {
    const user = await this.getCurrentUser(); // Fast check
    let query = this.supabase.from('bookings').select('*').order('created_at', { ascending: false });

    if (user) query = query.eq('customer_id', user.id);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

 async updateBookingStatus(bookingId: string, newStatus: string) {
    const { error } = await this.supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  }
async getDriverBookings(driverId: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(full_name, phone_number)
      `)
      .eq('driver_id', driverId)
      .order('pickup_time', { ascending: false });

    if (error) {
      console.error('Database fetch error:', error);
      throw error;
    }

    // Map the relational data to the flat structure the UI expects
    return data.map((ride: any) => ({
      ...ride,
      user_name: ride.customer?.full_name || 'Passenger Name Unavailable',
      user_phone: ride.customer?.phone_number || 'No Phone Provided'
    }));
  }

async getPendingRidesForDriver(driverId: string) {
    // 🚀 ULTIMATE SPEED TIP: If you have a Foreign Key set up...

    const { data: bookings, error: bookingError } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .eq('driver_id', driverId)
      .order('pickup_time', { ascending: true });

    if (bookingError) throw bookingError;
    if (!bookings || bookings.length === 0) return [];

    const customerIds = bookings.map(b => b.customer_id).filter(id => id != null);

    if (customerIds.length > 0) {
      const { data: profiles } = await this.supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .in('id', customerIds);

      if (profiles) {
        return bookings.map(booking => {
          const customerProfile = profiles.find(p => p.id === booking.customer_id);
          return {
            ...booking,
            // 🔴 CHANGED: Matches the HTML and TS mapping perfectly now!
            user_name: customerProfile?.full_name || 'Guest Passenger',
            user_phone: customerProfile?.phone_number || 'Confidential'
          };
        });
      }
    }
    return bookings;
  }

  /* ========================================= */
  /* === LOCATION & ROUTES ================= */
  /* ========================================= */

  async getLocations() {
    const { data, error } = await this.supabase
      .from('maharashtra_locations')
      .select('city_name, district')
      .eq('is_active', true)
      .order('city_name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async insertCustomRoute(routeData: any) {
    const { data, error } = await this.supabase
      .from('custom_routes') // NOTE: Double check if this should be 'routes' based on your home component!
      .insert([routeData])
      .select();

    if (error) throw error;
    return data;
  }

  async getActiveRoutes() {
    const { data, error } = await this.supabase
      .from('custom_routes') // NOTE: Same here, ensure table name matches
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }


}
