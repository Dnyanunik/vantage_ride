import { Component, Output, EventEmitter, Inject, PLATFORM_ID, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrls: ['./loader.scss']
})
export class LoaderComponent implements OnInit, OnDestroy {
  @Output() ready = new EventEmitter<void>();

  // UI Variables
  progress = 0;
  isStarted = false;
  statusText = 'TAP TO START ENGINE';
  roadSpeed = '2s'; // Default slow speed

  // Internal Logic Variables
  private timerId: any;
  private audio: HTMLAudioElement | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Pre-load Audio for instant playback
    if (isPlatformBrowser(this.platformId)) {
      // Path: If file is in 'src/public/image/caudio.mp3', use '/image/caudio.mp3'
      this.audio = new Audio('/image/caudio.mp3');
      this.audio.load();
    }
  }

  ngOnDestroy() {
    // 2. CLEANUP: Stop sound and timer if component is destroyed
    if (this.timerId) clearInterval(this.timerId);
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }

  startJourney() {
    if (this.isStarted) return;

    this.isStarted = true;
    this.roadSpeed = '0.2s'; // ANIMATION: Road moves fast
    this.statusText = 'INITIALIZING SYSTEMS...';

    // 3. Play Audio
    if (this.audio) {
      this.audio.volume = 1.0;
      this.audio.play().catch(e => console.warn('Audio play failed:', e));
    }

    // 4. Start Counting Logic
    let currentStep = 0;
    const speed = 30; // 30ms per step = approx 3 seconds total

    this.timerId = setInterval(() => {
      currentStep++;
      this.progress = currentStep;

      // Update Status Text
      if (this.progress === 20) this.statusText = 'CHECKING FLUIDS...';
      if (this.progress === 50) this.statusText = 'REVVING ENGINE...';
      if (this.progress === 80) this.statusText = 'FULL THROTTLE...';

      // FORCE UPDATE: Fixes the "0%" stuck bug
      this.cdr.detectChanges();

      // Finish Condition
      if (this.progress >= 100) {
        clearInterval(this.timerId);
        this.statusText = 'JOURNEY STARTED';
        this.cdr.detectChanges();

        // Wait 1 second before closing
        setTimeout(() => this.ready.emit(), 1000);
      }
    }, speed);
  }
}
