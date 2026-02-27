import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-move-out-final',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './move-out-final.html',
  styleUrls: ['./move-out-final.css']
})
export class MoveOutFinalComponent implements OnInit, OnDestroy {

  moveOutDate = '';
  currentBookingId = '';
  private bookingSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private location: Location,
    private bookingService: BookingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    const navState = this.router.getCurrentNavigation()?.extras?.state;
    if (navState) {
      if (navState['moveOutDate']) {
        this.moveOutDate = navState['moveOutDate'];
      }
      if (navState['moveOutDateTime']) {
        this.moveOutDate = this.formatDate(new Date(navState['moveOutDateTime']));
      }
    }

    if (!this.moveOutDate) {
      // SSR or direct access fallback
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 58);
      this.moveOutDate = this.formatDate(fallback);
    }

    this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
      if (booking) {
        this.currentBookingId = booking.id;
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  goBack() {
    this.location.back();
  }

  openNotifications() {
    this.router.navigate(['/notifications']);
  }

  logout() {
    // Implement logout logic here
    console.log('User logged out');
    this.router.navigate(['/login']);
  }

  seeWhatsNext() {
    this.router.navigate(['/whats-next-final']);
  }

  ngOnDestroy(): void {
    if (this.bookingSubscription) {
      this.bookingSubscription.unsubscribe();
    }
  }
}
