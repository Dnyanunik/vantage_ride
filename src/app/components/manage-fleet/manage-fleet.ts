import { Component, inject, PLATFORM_ID } from '@angular/core'; // Added PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common'; // Added isPlatformBrowser
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-manage-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './manage-fleet.html',
  styleUrls: ['./manage-fleet.scss']
})
export class ManageFleetComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // 🚀 Essential for Vercel Build

  isSubmitting = false;

  newCar = {
    name: '',
    type: 'Premium Sedan (4 Seater)',
    rate: null as number | null,
    minPkg: 300,
    desc: ''
  };

  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  onFileSelected(event: Event) {
    // 🚀 Only run file logic in the browser
    if (!isPlatformBrowser(this.platformId)) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => { this.imagePreview = reader.result; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  async publishVehicle() {
    // 🚀 Extra safety: Prevent submission if not in browser
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.newCar.name || !this.newCar.rate || !this.selectedFile) {
      alert('SYSTEM ERROR: Please fill in all required fields and select an image.');
      return;
    }

    try {
      this.isSubmitting = true;
      await this.supabase.uploadCarImageAndAddVehicle(this.newCar, this.selectedFile);

      alert('VEHICLE PUBLISHED: Your car is now live in the fleet!');
      this.router.navigate(['/services']);

    } catch (error: any) {
      alert('PUBLISH FAILED: ' + error.message);
    } finally {
      this.isSubmitting = false;
    }
  }
}
