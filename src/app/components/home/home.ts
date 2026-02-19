import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../theme';  // Ensure path is correct

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {
  themeService = inject(ThemeService);

  // --- CONTACT DETAILS ---
  phoneNumber1 = '+917972504272';
  phoneNumber2 = '+919552263633';
  email = 'vishnushitole978@gmail.com';

  // --- FLEET DATA (Your Specific Rates) ---
  cars = [
    {
      name: 'Maruti Suzuki Ertiga',
      type: 'Royal SUV (6+1 Seater)',
      image: 'image/Ertiga_Car.jpeg',
      rate: 14,
      desc: 'Spacious & Powerful. Best for families.',
      minPkg: '300 km'
    },
    {
      name: 'Swift Dzire',
      type: 'Premium Sedan (4 Seater)',
      image: 'image/swift.jpeg',
      rate: 12,
      desc: 'High comfort, smooth ride. Best for couples/small groups.',
      minPkg: '300 km'
    },
    {
      name: 'Swift Dzire New Look',
      type: 'Comfort Class (4 Seater)',
      image: 'image/desire.jpeg',
      rate: 12,
      desc: 'Smooth ride,Best for couples/small groups',
      minPkg: '300 km'
    }
  ];

  // --- ROUND TRIP PACKAGES (From your Image) ---
  popularRoutes = [
    { dest: 'Pune ⇄ Bhimashankar', km: '300', price4: 3599, price6: 4500 },
    { dest: 'Pune ⇄ Lonavala', km: '300', price4: 3599, price6: 4500 },
    { dest: 'Pune ⇄ Mahabaleshwar', km: '300', price4: 3599, price6: 4500 },
    { dest: 'Pune ⇄ Matheran', km: '300', price4: 3999, price6: 4599 },
    { dest: 'Pune ⇄ Alibag', km: '300', price4: 5999, price6: 6599 },
    { dest: 'Pune ⇄ Diveagar', km: '300', price4: 5999, price6: 6599 },
    { dest: 'Pune ⇄ Tarkarli', km: '300', price4: 10999, price6: 12599 },
    { dest: 'Pune ⇄ Goa', km: '1000', price4: 14999, price6: 16999 },
  ];

  // --- ACTIONS ---
  makeCall() { window.location.href = `tel:${this.phoneNumber1}`; }
  sendEmail() { window.location.href = `mailto:${this.email}`; }

  bookRide(carName: string) {
    const text = `Hello, I am interested in booking the ${carName}.`;
    window.open(`https://wa.me/${this.phoneNumber1.replace('+','')}?text=${encodeURIComponent(text)}`, '_blank');
  }
}
