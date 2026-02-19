import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../theme';
import { EnquiryDialog } from '../enquiry-dialog/enquiry-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Import MatDialogModule
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule for dialog buttons
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule for icons in the dialog
import { RouterLink } from '@angular/router'; // Import RouterLink for navigation in the navbar
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  // Add MatDialogModule here so the Navbar can handle dialog actions
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, RouterLink, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {
  themeService = inject(ThemeService);
  isMenuOpen = false;
  isScrolled = false;

  // Inject MatDialog using the constructor
  constructor(private dialog: MatDialog) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

    // Optional: Prevent body scroll when menu is open
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

 openBookingDialog() {
  const dialogRef = this.dialog.open(EnquiryDialog, {
    width: '500px',
    maxWidth: '95vw',
    data: { service: 'Luxury Ride' },
    panelClass: 'custom-cockpit-dialog'
  });

  dialogRef.afterClosed().subscribe(result => {
    // 'result' now contains: name, phone, source, destination, car, message, price, extraKm
    if (result) {
      console.log('Booking Details:', result);
      this.sendToWhatsApp(result);
    }
  });
}

sendToWhatsApp(data: any) {
  // We use the price and extraKm directly from the data sent back by the dialog
  const message =
    `*NEW SWIFTLUX BOOKING*%0A` +
    `--------------------------%0A` +
    `👤 *Name:* ${data.name}%0A` +
    `📞 *Phone:* ${data.phone}%0A` +
    `🚗 *Car:* ${data.car}%0A` +
    `📍 *From:* ${data.source}%0A` +
    `🏁 *To:* ${data.destination}%0A` +
    `💰 *Fare:* ${data.price}%0A` +
    `📏 *Limit:* ${data.extraKm}%0A` +
    `--------------------------%0A` +
    `💬 *Note:* ${data.message || 'Standard Request'}`;

  window.open(`https://wa.me/917972504272?text=${message}`, '_blank');
}
}
