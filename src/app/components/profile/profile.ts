import { Component, OnInit, inject, HostListener, ChangeDetectorRef } from '@angular/core'; // 🔴 1. Import ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase';
import { ThemeService } from '../../theme';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  supabase = inject(SupabaseService);
  themeService = inject(ThemeService);
  fb = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef); // 🔴 2. Inject it to wake up Angular

  profileForm!: FormGroup;
  userId: string | null = null;
  loading = true;
  saving = false;

  isOffline = !navigator.onLine;

  // Read-only properties
  userRole = 'customer';
  isVerified = false;
  avatarUrl: string | null = null;

  @HostListener('window:offline')
  onOffline() {
    this.isOffline = true;
    this.cdr.detectChanges(); // Update UI instantly
  }

  @HostListener('window:online')
  onOnline() {
    this.isOffline = false;
    this.cdr.detectChanges(); // Update UI instantly
  }

  ngOnInit() {
    // Initialize form first
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      full_name: ['', Validators.required],
      phone_number: ['', [Validators.pattern('^[0-9+ ]+$')]]
    });

    // Disable form while loading so user doesn't type before data arrives
    this.profileForm.disable();

    // Fetch data
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.loading = true;

      // 🚀 Fast local check
      const user = await this.supabase.getCurrentUser();
      if (!user) return;

      this.userId = user.id;

      // Fetch from public.profiles table
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('username, full_name, phone_number, role, is_verified, avatar_url')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      if (data) {
        // 🚀 Instantly patch the form with database data
        this.profileForm.patchValue({
          username: data.username || '',
          full_name: data.full_name || '',
          phone_number: data.phone_number || ''
        });

        this.userRole = data.role || 'customer';
        this.isVerified = data.is_verified || false;

        if (data.avatar_url) {
          this.avatarUrl = `${data.avatar_url}?t=${new Date().getTime()}`;
        } else {
          this.avatarUrl = null;
        }
      }
    } catch (error) {
      console.error('Error loading profile', error);
    } finally {
      this.loading = false;
      this.profileForm.enable(); // Re-enable form
      this.cdr.detectChanges(); // 🔴 3. FORCE ANGULAR TO SHOW THE DATA INSTANTLY
    }
  }

  async updateProfile() {
    if (this.profileForm.invalid || !this.userId || this.isOffline) return;

    try {
      this.saving = true;
      this.profileForm.disable(); // Lock form while saving
      this.cdr.detectChanges();

      const updates = {
        id: this.userId,
        ...this.profileForm.value,
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase.client
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      alert('Pilot Profile Updated Successfully!');

    } catch (error: any) {
      alert('Error updating profile: ' + error.message);
    } finally {
      this.saving = false;
      this.profileForm.enable(); // Unlock form
      this.cdr.detectChanges(); // 🔴 Update UI instantly
    }
  }

  async onFileSelected(event: any) {
    if (this.isOffline) {
      alert("Cannot upload avatar while offline.");
      return;
    }

    const file = event.target.files[0];
    if (!file || !this.userId) return;

    this.saving = true;
    this.cdr.detectChanges(); // Show loading spinner for image upload instantly

    const TARGET_WIDTH = 300;
    const TARGET_HEIGHT = 300;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;

        if (ctx) {
          ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        }

        canvas.toBlob(async (blob) => {
          if (!blob) {
            this.saving = false;
            this.cdr.detectChanges();
            return;
          }

          try {
            const resizedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            const finalUrl = await this.supabase.uploadAvatar(this.userId!, resizedFile);
            this.avatarUrl = `${finalUrl}?t=${new Date().getTime()}`;
            console.log("SUCCESS: Image stored in Supabase avatars section!");

          } catch (error: any) {
            console.error("UPLOAD CRASHED:", error.message);
            alert("Sync Failed: " + error.message);
          } finally {
            this.saving = false;
            this.cdr.detectChanges(); // 🔴 Hide saving spinner instantly
          }
        }, 'image/jpeg', 0.9);
      };

      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
