import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ContractService } from '../../services/contract';
import { ContractDetails } from '../../models/contract';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-contract',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './contract.html',
    styleUrls: ['./contract.css']
})
export class ContractComponent implements OnInit, AfterViewInit, OnDestroy {

    contractDetails: ContractDetails | null = null;
    isLoading = true;
    currentBookingId = '';
    private bookingSubscription: Subscription | null = null;

    constructor(
        private router: Router,
        private location: Location,
        private contractService: ContractService,
        private bookingService: BookingService,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        // Load immediately for SSR
        this.loadContractDetails();

        // Subscribe to booking changes
        this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
            if (booking) {
                this.currentBookingId = booking.id;
                // Update the mock details to match the selected booking
                if (this.contractDetails && this.contractDetails.booking) {
                    this.contractDetails.booking.bookingId = booking.id;
                }
            }
        });
    }

    ngAfterViewInit(): void {
        // Also try loading after view init for browser
        if (isPlatformBrowser(this.platformId) && this.isLoading) {
            this.loadContractDetails();
        }
    }

    private loadContractDetails(): void {
        this.contractService.getContractDetails().subscribe({
            next: (details) => {
                this.contractDetails = details;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load contract details:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    goBack(): void {
        this.location.back();
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }

    startNotice(): void {
        this.router.navigate(['/notice']);
    }

    copyToClipboard(text: string): void {
        if (isPlatformBrowser(this.platformId)) {
            navigator.clipboard.writeText(text);
        }
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }
}
