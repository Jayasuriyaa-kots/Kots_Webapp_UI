import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { ParkingService } from '../../services/parking';
import { BookingService } from '../../services/booking';
import { TicketService } from '../../services/ticket';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-car-parking-waiting',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './car-parking-waiting.html',
    styleUrls: ['./car-parking-waiting.css']
})
export class CarParkingWaitingComponent implements OnInit {

    userId: string = '';
    waitingListNumber: number = 0;
    isLoading: boolean = true;
    isSendingRequest: boolean = false;
    requestSent: boolean = false;
    requestError: string = '';
    isCancelling: boolean = false;
    hasNoParkingRecord: boolean = false;
    private isBrowser: boolean;

    constructor(
        private location: Location,
        private router: Router,
        private parkingService: ParkingService,
        private bookingService: BookingService,
        private ticketService: TicketService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        const booking = this.bookingService.getSelectedBookingValue();
        if (booking) {
            this.userId = booking.id;
        }

        // Restore persisted request state
        if (this.isBrowser && this.userId) {
            const saved = localStorage.getItem(`parking_request_${this.userId}`);
            if (saved === 'sent') {
                this.requestSent = true;
            }
        }

        // Check cached status first
        const status = this.parkingService.getLastParkingStatus();
        if (status && status.success && status.is_in_waiting_list && status.waiting_list_number) {
            this.waitingListNumber = status.waiting_list_number;
            this.isLoading = false;
        } else if (status && !status.success) {
            // No parking record found
            this.hasNoParkingRecord = true;
            this.isLoading = false;
        } else if (this.userId) {
            // Fetch from API
            this.parkingService.getParkingStatus(this.userId).subscribe(response => {
                if (response.success && response.waiting_list_number) {
                    this.waitingListNumber = response.waiting_list_number;
                } else if (!response.success) {
                    this.hasNoParkingRecord = true;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            });
        } else {
            this.hasNoParkingRecord = true;
            this.isLoading = false;
        }
    }

    requestParking(): void {
        if (!this.userId || this.isSendingRequest) return;

        this.isSendingRequest = true;
        this.requestError = '';

        const webhookPayload = {
            timestamp: new Date().toISOString(),
            phone: '', // Backend will override with cookie session
            servicetype: 'Parking Issues',
            subcategory: 'Parking Issues',
            servicetranscript: `requesting for a car parking - (${this.userId})`,
            call_transcript: null,
            booking_id: this.userId,
            channel: 'Mobile App',
            layout: 'Tenant SRs',
            classification: 'AO-Common Area Issues',
        };

        this.ticketService.raiseTicket(webhookPayload).subscribe({
            next: (response) => {
                console.log('Parking request successful:', response);
                this.isSendingRequest = false;
                this.requestSent = true;
                if (this.isBrowser) {
                    localStorage.setItem(`parking_request_${this.userId}`, 'sent');
                }

                // Immediate local toast for zero latency
                this.toastService.show({
                    title: 'System Message',
                    message: "Your car parking request has been received. Our team will look into it shortly.",
                    type: 'info',
                    icon: 'parking_request_icon'
                });

                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isSendingRequest = false;
                this.requestError = 'Failed to raise parking request ticket. Please try again.';
                console.error('Parking request error:', err);
                this.cdr.detectChanges();
            }
        });
    }

    cancelRequest(): void {
        if (!this.userId || this.isCancelling) return;

        this.isCancelling = true;
        this.requestError = '';

        const webhookPayload = {
            timestamp: new Date().toISOString(),
            phone: '', // Backend will override with cookie session
            servicetype: 'Parking Issues',
            subcategory: 'Parking Issues',
            servicetranscript: `cancelling the parking request - (${this.userId})`,
            call_transcript: null,
            booking_id: this.userId,
            channel: 'Mobile App',
            layout: 'Tenant SRs',
            classification: 'AO-Common Area Issues',
        };

        this.ticketService.raiseTicket(webhookPayload).subscribe({
            next: (response) => {
                console.log('Parking cancellation successful:', response);
                this.isCancelling = false;
                this.requestSent = false;
                if (this.isBrowser) {
                    localStorage.removeItem(`parking_request_${this.userId}`);
                }

                // Immediate local toast for zero latency
                console.log('CarParkingWaiting: Triggering local toast for cancellation');
                this.toastService.show({
                    title: 'System Message',
                    message: "Your car parking request has been cancelled.",
                    type: 'info',
                    icon: 'parking_cancel_icon'
                });

                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isCancelling = false;
                this.requestError = 'Failed to raise cancellation ticket. Please try again.';
                console.error('Parking cancellation error:', err);
                this.cdr.detectChanges();
            }
        });
    }

    goBack(): void {
        this.location.back();
    }

    goHome(): void {
        this.router.navigate(['/home']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
