import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent implements OnInit {
  currentSlide = 0;

  // Touch/swipe support
  private touchStartX = 0;
  private touchEndX = 0;
  private minSwipeDistance = 50;

  slides = [
    {
      image: 'assets/images/onboarding-1.svg',
      title: 'Better Quality Flats',
      description: 'Never compromise on your dreams on your home'
    },
    {
      image: 'assets/images/onboarding-2.svg',
      title: 'Find Your Perfect Home',
      description: 'Browse through thousands of verified properties'
    },
    {
      image: 'assets/images/onboarding-3.svg',
      title: 'Easy & Secure Booking',
      description: 'Book your dream home with just a few taps'
    },
    {
      image: 'assets/images/onboarding-4.svg',
      title: 'Get Started Today',
      description: 'Join thousands of happy home seekers'
    }
  ];

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    // Set pure black background for onboarding
    this.themeService.setPageBackground('#000000');
  }

  get totalSlides() {
    return this.slides.length;
  }

  get currentSlideData() {
    return this.slides[this.currentSlide];
  }

  get isLastSlide() {
    return this.currentSlide === this.totalSlides - 1;
  }

  get buttonText() {
    return this.isLastSlide ? 'Login' : 'Skip';
  }

  skip() {
    this.router.navigate(['/login']);
  }

  nextSlide() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.currentSlide++;
    } else {
      this.skip();
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  // Touch event handlers for swipe
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (Math.abs(swipeDistance) < this.minSwipeDistance) {
      return; // Not a significant swipe
    }

    if (swipeDistance < 0) {
      // Swipe left - go to next slide
      this.nextSlide();
    } else {
      // Swipe right - go to previous slide
      this.prevSlide();
    }
  }
}