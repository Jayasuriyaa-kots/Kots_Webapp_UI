import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SplintyService, SplintyUser } from '../../services/splinty';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-splinty-access',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './splinty-access.html',
    styleUrls: ['./splinty-access.css']
})
export class SplintyAccessComponent implements OnInit, OnDestroy {

    userId = '';
    users: SplintyUser[] = [];
    loading = true;
    error = '';
    private bookingSubscription: Subscription | null = null;

    constructor(
        private router: Router,
        private splintyService: SplintyService,
        private bookingService: BookingService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadUserData();
        this.loadSplintyUsers();
    }

    loadUserData(): void {
        this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
            if (booking) {
                this.userId = booking.id;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }

    maxOccupancy = '';

    loadSplintyUsers(): void {
        if (!this.userId) return;

        this.loading = true;
        this.error = '';

        this.splintyService.getOccupancyDetails(this.userId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.users = response.co_occupants;
                    this.maxOccupancy = response.max_occupancy || 'N/A';
                } else {
                    this.error = response.message || 'Failed to load occupancy details';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = 'Failed to load co-occupants';
                this.loading = false;
                this.cdr.detectChanges();
                console.error('Error loading occupancy details:', err);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/profile']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
