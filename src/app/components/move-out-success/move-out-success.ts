import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BankDetailsComponent } from '../bank-details/bank-details';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-move-out-success',
  standalone: true,
  imports: [CommonModule, BankDetailsComponent],
  templateUrl: './move-out-success.html',
  styleUrls: ['./move-out-success.css']
})
export class MoveOutSuccessComponent implements OnInit, OnDestroy {

  moveOutDate = '';
  showBankDetails = false;
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

  addBankDetails() {
    this.showBankDetails = true;
  }

  closeBankDetails() {
    this.showBankDetails = false;
  }

  onBankDetailsSubmitted() {
    this.router.navigate(['/move-out-final'], {
      state: { moveOutDate: this.moveOutDate }
    });
  }

  seeWhatsNext() {
    this.router.navigate(['/whats-next']);
  }

  ngOnDestroy(): void {
    if (this.bookingSubscription) {
      this.bookingSubscription.unsubscribe();
    }
  }
}
