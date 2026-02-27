import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BookingService, BookingInfo } from '../../services/booking';

@Component({
    selector: 'app-select-booking',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './select-booking.html',
    styleUrls: ['./select-booking.css']
})
export class SelectBookingComponent implements OnInit {
    bookingIds: BookingInfo[] = [];

    constructor(
        private router: Router,
        private bookingService: BookingService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            // Get bookings from the service (fetched from API after OTP verification)
            this.bookingIds = this.bookingService.getBookingsForUser();
        }
    }

    selectBooking(booking: BookingInfo) {
        // Store selected booking via the service
        this.bookingService.setSelectedBooking(booking);
        // Navigate to home after selection
        this.router.navigate(['/home']);
    }
}
