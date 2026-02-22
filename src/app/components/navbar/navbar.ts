import { Component, HostListener, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // 🔴 1. Add ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterLinkActive, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

import { ThemeService } from '../../theme';
import { EnquiryDialog } from '../enquiry-dialog/enquiry-dialog';
import { SupabaseService } from '../../services/supabase';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { NotificationDriverComponent } from '../notification-driver/notification-driver';
import{ NotificationUserComponent } from '../notification-user/notification-user';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    NotificationDriverComponent,
    RouterLinkActive,
    RouterModule,
    NotificationUserComponent
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar implements OnInit {
  currentUser: User | null = null;
  avatarUrl: string | null = null;
  isMenuOpen = false;
  isScrolled = false;
  isDriver = false;

  themeService = inject(ThemeService);
  cdr = inject(ChangeDetectorRef); // 🔴 2. Inject it

  constructor(
    private dialog: MatDialog,
    public supabase: SupabaseService,
    private router: Router
  ) {}

  get userDisplayName(): string {
    if (!this.currentUser || !this.currentUser.user_metadata) return 'PILOT';
    const name = this.currentUser.user_metadata['full_name'];
    return name ? name.split(' ')[0] : 'COMMANDER';
  }

  get userAvatar(): string {
    if (this.avatarUrl) return this.avatarUrl;
    if (this.currentUser?.user_metadata?.['avatar_url']) {
      return this.currentUser.user_metadata['avatar_url'];
    }
    return 'assets/default-pilot.png'; // Made sure this is a valid path
  }

  async ngOnInit() {
    // 🚀 SPEED BOOST: Fetch user first
    this.currentUser = await this.supabase.getCurrentUser();

    // Instantly check role (it's local, no database trip needed)
    this.checkUserRole();

    // Fetch avatar in the background (doesn't block the UI)
    this.checkAvatar();

    if (this.currentUser && this.router.url.includes('/login')) {
      this.router.navigate(['/']);
    }

    this.cdr.detectChanges(); // 🔴 WAKE UP ANGULAR

    // Subscribe to Auth changes (Handles login/logout events)
    this.supabase.authChanges((event: AuthChangeEvent, session: Session | null) => {
      this.currentUser = session?.user || null;

      if (this.currentUser) {
        this.checkUserRole();
        this.checkAvatar();
      } else {
        // Reset state instantly on logout
        this.isDriver = false;
        this.avatarUrl = null;
      }

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      } else if (this.currentUser && this.router.url.includes('/login')) {
        this.router.navigate(['/']);
      }

      this.cdr.detectChanges(); // 🔴 WAKE UP ANGULAR ON AUTH EVENT
    });
  }

  // 🚀 SPEED BOOST: Removed 'async' because this data is already downloaded!
  checkUserRole() {
    if (!this.currentUser) {
      this.isDriver = false;
      return;
    }
    const role = this.currentUser.user_metadata?.['role'];
    this.isDriver = role === 'driver';
  }

  async checkAvatar() {
    if (!this.currentUser) {
      this.avatarUrl = null;
      return;
    }
    try {
      const { data, error } = await this.supabase.supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', this.currentUser.id)
        .single();

      if (!error && data?.avatar_url) {
        // 🚀 ADDED CACHE BUSTER: Forces the browser to load the newest image instantly
        this.avatarUrl = `${data.avatar_url}?t=${new Date().getTime()}`;
      }
    } catch (err) {
      console.error('Avatar fetch error:', err);
    } finally {
      this.cdr.detectChanges(); // Wake up UI when avatar finally arrives
    }
  }

  async handleLogout() {
    await this.supabase.signOut();
    // The authChanges listener above will automatically catch this and update the UI!
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : 'auto';
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  openBookingDialog() {
    this.dialog.open(EnquiryDialog, {
      width: '400px',
      data: { user: this.currentUser }
    });
  }
}
