import { Injectable, signal, effect, Renderer2, Inject, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeType = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;

  // 1. Use Signals for reactive state
  themeSignal = signal<ThemeType>('dark');

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // 2. Automatically update the <body> class when the signal changes
    effect(() => {
      const theme = this.themeSignal();
      this.renderer.removeClass(this.document.body, 'theme-light');
      this.renderer.removeClass(this.document.body, 'theme-dark');
      this.renderer.addClass(this.document.body, `theme-${theme}`);
    });
  }

  // 3. Public methods to control the theme
  toggleTheme() {
    this.themeSignal.set(this.themeSignal() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeType) {
    this.themeSignal.set(theme);
  }
}
