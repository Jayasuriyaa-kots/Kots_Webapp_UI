import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    /**
     * Set the page background color - updates html and body background
     * to match the component's theme and cover safe areas
     */
    setPageBackground(color: string): void {
        if (!this.isBrowser) return;

        document.documentElement.style.backgroundColor = color;
        document.body.style.backgroundColor = color;
    }

    /**
     * Preset colors for common themes
     */
    setDarkTheme(): void {
        this.setPageBackground('#0a0a0a');
    }

    setDarkGreyTheme(): void {
        this.setPageBackground('#1a1a1a');
    }

    setLightTheme(): void {
        this.setPageBackground('#ffffff');
    }

    setCreamTheme(): void {
        this.setPageBackground('#e6e6d5');
    }
}
