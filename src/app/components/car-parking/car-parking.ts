import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';
import { ParkingService, ParkingStatusResponse } from '../../services/parking';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-car-parking',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './car-parking.html',
    styleUrls: ['./car-parking.css']
})
export class CarParkingComponent implements OnInit, OnDestroy {

    currentBookingId = '';
    parkingStatus: string = '';
    totalAvailable: number = 0;
    totalPaid: number = 0;
    reservedSlots: number = 0;
    isSlotReserved: boolean = false;
    isLoading: boolean = true;
    private bookingSubscription: Subscription | null = null;

    constructor(
        private location: Location,
        private router: Router,
        private bookingService: BookingService,
        private parkingService: ParkingService
    ) { }

    ngOnInit(): void {
        this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
            if (booking) {
                this.currentBookingId = booking.id;
            }
        });

        // Load parking details from cached status or fetch fresh
        const status = this.parkingService.getLastParkingStatus();
        if (status && status.success && !status.is_in_waiting_list && status.parking_details) {
            this.loadParkingDetails(status);
        } else if (this.currentBookingId) {
            this.parkingService.getParkingStatus(this.currentBookingId).subscribe(response => {
                this.loadParkingDetails(response);
            });
        } else {
            this.isLoading = false;
        }
    }

    private loadParkingDetails(status: ParkingStatusResponse): void {
        if (status.parking_details) {
            this.parkingStatus = status.parking_details.status;
            this.totalAvailable = status.parking_details.total_available_parking_slots;
            this.totalPaid = status.parking_details.total_paid_parking_slots;
            this.reservedSlots = status.parking_details.reserved_parking_slots;
            this.isSlotReserved = status.parking_details.parking_slot_reserved;
        }
        this.isLoading = false;
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }

    goBack(): void {
        this.location.back();
    }

    payNow(): void {
        this.router.navigate(['/car-parking-success']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
