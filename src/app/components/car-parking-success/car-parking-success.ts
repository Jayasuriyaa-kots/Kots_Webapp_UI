import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-car-parking-success',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './car-parking-success.html',
    styleUrls: ['./car-parking-success.css']
})
export class CarParkingSuccessComponent implements OnInit {

    userId: string = '';

    constructor(
        private router: Router,
        private bookingService: BookingService
    ) { }

    ngOnInit() {
        const booking = this.bookingService.getSelectedBookingValue();
        if (booking) {
            this.userId = booking.id;
        }
    }

    goToHome(): void {
        this.router.navigate(['/home']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }

    goBack(): void {
        this.router.navigate(['/home']); // Or back to car parking?
    }
}
