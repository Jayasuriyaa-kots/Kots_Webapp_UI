import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WifiService, WifiCredentials } from '../../services/wifi';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-wifi-credentials',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './wifi-credentials.html',
    styleUrls: ['./wifi-credentials.css']
})
export class WifiCredentialsComponent implements OnInit, OnDestroy {

    userId = '';
    credentials: WifiCredentials | null = null;
    loading = true;
    error = '';
    private bookingSubscription: Subscription | null = null;

    constructor(
        private router: Router,
        private wifiService: WifiService,
        private bookingService: BookingService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadUserData();
        this.loadWifiCredentials();
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

    loadWifiCredentials(): void {
        if (!this.userId) {
            this.error = 'No booking selected';
            this.loading = false;
            return;
        }

        this.loading = true;
        this.error = '';

        this.wifiService.getWifiCredentials(this.userId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.credentials = {
                        wifi_id: response.wifi_id,
                        wifi_password: response.wifi_password
                    };
                } else {
                    this.error = response.message || 'Failed to load wifi credentials';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = 'Failed to load wifi credentials';
                this.loading = false;
                this.cdr.detectChanges();
                console.error('Error loading wifi credentials:', err);
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

