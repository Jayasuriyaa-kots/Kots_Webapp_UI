import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ParkingService, ParkingStatusResponse } from '../../services/parking';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-car-parking-queue-success',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './car-parking-queue-success.html',
    styleUrls: ['./car-parking-queue-success.css']
})
export class CarParkingQueueSuccessComponent implements OnInit {

    userId: string = '';
    waitingListNumber: number = 0;

    constructor(
        private router: Router,
        private parkingService: ParkingService,
        private bookingService: BookingService
    ) { }

    ngOnInit(): void {
        const booking = this.bookingService.getSelectedBookingValue();
        if (booking) {
            this.userId = booking.id;
        }

        // Get the last parking status (already fetched during navigation)
        const status = this.parkingService.getLastParkingStatus();
        if (status && status.is_in_waiting_list && status.waiting_list_number) {
            this.waitingListNumber = status.waiting_list_number;
        } else if (this.userId) {
            // Fallback: fetch fresh from API
            this.parkingService.getParkingStatus(this.userId).subscribe(response => {
                if (response.success && response.waiting_list_number) {
                    this.waitingListNumber = response.waiting_list_number;
                }
            });
        }
    }

    goToHome(): void {
        this.router.navigate(['/home']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }
}
