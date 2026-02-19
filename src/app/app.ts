import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { LoaderComponent } from './components/loader/loader';
import { Navbar } from './components/navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoaderComponent, Navbar, RouterOutlet, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  // We start as true, but ngOnInit will flip it immediately if needed
  isAppStarting: boolean = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if we've already seen the loader in this session
      const hasSeenLoader = sessionStorage.getItem('app_initialized');

      if (hasSeenLoader === 'true') {
        this.isAppStarting = false;
      }
    } else {
      // On Server (SSR), we hide the loader so Google can see the content
      this.isAppStarting = false;
    }
  }

  onLoadingComplete() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('app_initialized', 'true');
    }
    this.isAppStarting = false;
  }
}
