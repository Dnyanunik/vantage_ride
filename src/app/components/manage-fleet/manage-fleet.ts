import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon'; // Make sure this is imported!

@Component({
  selector: 'app-manage-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './manage-fleet.html',
  styleUrls: ['./manage-fleet.scss']
})
export class ManageFleetComponent {
  supabase = inject(SupabaseService);
  router = inject(Router);

  isSubmitting = false;

  newCar = {
    name: '',
    type: 'Premium Sedan (4 Seater)',
    rate: null,
    minPkg: 300,
    desc: ''
  };

  // --- NEW: Variables for File Handling ---
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  // --- NEW: Handle file selection from gallery ---
  onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedFile = input.files[0];
    console.log("File Type:", this.selectedFile.type); // Should say image/jpeg or image/png
    console.log("File Size:", this.selectedFile.size); // Should be > 0

    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result; };
    reader.readAsDataURL(this.selectedFile);
  }
}

  // --- NEW: Remove selected image ---
  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }
async publishVehicle() {
    if (!this.newCar.name || !this.newCar.rate || !this.selectedFile) {
      alert('SYSTEM ERROR: Please fill in all required fields and select an image.');
      return;
    }

    try {
      this.isSubmitting = true;

      // Call the new service method we just created!
      await this.supabase.uploadCarImageAndAddVehicle(this.newCar, this.selectedFile);

      alert('VEHICLE PUBLISHED: Your car is now live in the fleet!');
      this.router.navigate(['/services']); // Or wherever you display the cars

    } catch (error: any) {
      alert('PUBLISH FAILED: ' + error.message);
    } finally {
      this.isSubmitting = false;
    }
  }
}
