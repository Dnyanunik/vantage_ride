import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class Signup {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  loading = false;

  // 🔴 INLINE INITIALIZATION: SSR-Safe & 100% Regex Validated
  signupForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s\-']{3,50}$/)]],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{3,20}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10}$/)]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_\-]{6,}$/)]],
    role: ['customer', Validators.required],
    licenseNumber: [''],
    vehicleModel: [''],
    vehiclePlate: ['']
  });

  constructor() {
    this.setupRoleListener();
  }

  // Dynamically apply Regex if they switch to "PILOT" (Driver)
  private setupRoleListener() {
    this.signupForm.get('role')?.valueChanges.subscribe(role => {
      const licenseCtrl = this.signupForm.get('licenseNumber');
      const modelCtrl = this.signupForm.get('vehicleModel');
      const plateCtrl = this.signupForm.get('vehiclePlate');

      if (role === 'driver') {
        licenseCtrl?.setValidators([Validators.required, Validators.pattern(/^[A-Z0-9\-]{6,20}$/i)]);
        modelCtrl?.setValidators([Validators.required, Validators.pattern(/^[a-zA-Z0-9\s\.\-]{2,30}$/)]);
        plateCtrl?.setValidators([Validators.required, Validators.pattern(/^[A-Z]{2}[\s\-]?[0-9]{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?[0-9]{4}$/i)]);
      } else {
        licenseCtrl?.clearValidators();
        modelCtrl?.clearValidators();
        plateCtrl?.clearValidators();

        licenseCtrl?.setValue('');
        modelCtrl?.setValue('');
        plateCtrl?.setValue('');
      }

      licenseCtrl?.updateValueAndValidity();
      modelCtrl?.updateValueAndValidity();
      plateCtrl?.updateValueAndValidity();
    });
  }

  async onSignup() {
    if (this.signupForm.invalid) {
      alert("Validation Error: Please ensure all fields match the required formats.");
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const val = this.signupForm.value;

      const { data, error: authError } = await this.supabase.signUp(val.email, val.password, {
        full_name: val.fullName,
        username: val.username,
        phone_number: val.phoneNumber,
        role: val.role
      });

      if (authError) throw authError;

      if (val.role === 'driver' && data.user) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const { error: driverError } = await this.supabase.insertDriverDetails({
          id: data.user.id,
          license_number: val.licenseNumber.toUpperCase(),
          vehicle_model: val.vehicleModel,
          vehicle_plate: val.vehiclePlate.toUpperCase()
        });

        if (driverError) throw driverError;
      }

      alert('Registration Successful! Please check your email.');
      this.router.navigate(['/login']);

    } catch (err: any) {
      alert(`REGISTRATION ERROR: ${err.message || 'System Failure'}`);
    } finally {
      this.loading = false;
    }
  }
}
