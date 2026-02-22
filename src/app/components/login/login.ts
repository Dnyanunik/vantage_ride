import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  loading = false;

  // Strict regex patterns (Regression) for validation
  loginForm: FormGroup = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    ]],
    password: ['', [Validators.required]]
  });

  goToSignup() {
    this.router.navigate(['/signup']);
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const { email, password } = this.loginForm.value;
      const { data, error } = await this.supabase.signIn(email, password);

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('ACCESS DENIED: Please verify your email link.');
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('AUTH FAILURE: Credentials do not match our manifest.');
        } else {
          throw error;
        }
      }

      if (data.user) {
        this.router.navigate(['/home']);
      }

    } catch (err: any) {
      alert(err.message || 'SYSTEM ERROR: Connection to Fleet Core failed.');
    } finally {
      this.loading = false;
    }
  }
}
