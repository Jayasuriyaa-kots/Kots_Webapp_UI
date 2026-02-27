import {
    Component,
    OnInit,
    OnDestroy,
    NgZone,
    Inject,
    PLATFORM_ID
} from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CountdownCircleComponent } from '../countdown-circle/countdown-circle';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-notice-success',
    standalone: true,
    imports: [CommonModule, CountdownCircleComponent],
    templateUrl: './notice-success.html',
    styleUrls: ['./notice-success.css']
})
export class NoticeSuccessComponent implements OnInit, OnDestroy {

    moveOutDate = '';
    moveOutDateTime: Date = new Date(Date.now() + 58 * 24 * 60 * 60 * 1000); // Default: 58 days from now

    // Countdown values
    days = '00';
    hours = '00';
    minutes = '00';
    seconds = '00';

    // Digits for unconfirmed view
    daysTens = '0';
    daysOnes = '0';
    hoursTens = '0';
    hoursOnes = '0';

    // State
    isConfirmed = false;
    canMoveOut = false;
    userId: string = '';

    // Progress ring
    readonly radius = 90;
    readonly circumference = 2 * Math.PI * this.radius;
    progressOffset = this.circumference;

    private totalDurationSeconds = 1;
    private destroyed = false;

    constructor(
        private router: Router,
        private location: Location,
        private ngZone: NgZone,
        private bookingService: BookingService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    // -------------------- LIFECYCLE --------------------

    ngOnInit(): void {
        // Check if navigated with confirmed state
        const navState = this.router.getCurrentNavigation()?.extras?.state;
        if (navState) {
            if (navState['isConfirmed']) {
                this.isConfirmed = true;
            }
            if (navState['moveOutDateTime']) {
                this.moveOutDateTime = new Date(navState['moveOutDateTime']);
                this.moveOutDate = this.formatDate(this.moveOutDateTime);
            }
        }

        // Load Booking ID
        const booking = this.bookingService.getSelectedBookingValue();
        if (booking) {
            this.userId = booking.id;
        }

        this.initializeMoveOutDate();

        this.totalDurationSeconds = Math.max(
            1,
            Math.floor(
                (this.moveOutDateTime.getTime() - Date.now()) / 1000
            )
        );

        if (isPlatformBrowser(this.platformId)) {
            this.tick(); // 🔥 start recursive ticking
        }
    }

    ngOnDestroy(): void {
        this.destroyed = true;
    }

    // -------------------- LIVE TICK --------------------

    private tick(): void {
        if (this.destroyed) return;

        this.ngZone.run(() => {
            this.updateCountdown();
        });

        setTimeout(() => this.tick(), 1000);
    }

    private updateCountdown(): void {
        const diffMs = this.moveOutDateTime.getTime() - Date.now();

        if (diffMs <= 0) {
            this.setZeroState();
            return;
        }

        const totalSeconds = Math.floor(diffMs / 1000);

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        this.days = this.pad(days);
        this.hours = this.pad(hours);
        this.minutes = this.pad(minutes);
        this.seconds = this.pad(seconds);

        this.daysTens = this.days[0];
        this.daysOnes = this.days[1];
        this.hoursTens = this.hours[0];
        this.hoursOnes = this.hours[1];

        this.updateProgress(totalSeconds);
    }

    private updateProgress(remainingSeconds: number): void {
        const progress = remainingSeconds / this.totalDurationSeconds;
        this.progressOffset = this.circumference * (1 - progress);
    }

    private setZeroState(): void {
        this.days = this.hours = this.minutes = this.seconds = '00';
        this.daysTens = this.daysOnes = this.hoursTens = this.hoursOnes = '0';
        this.progressOffset = 0;
        this.canMoveOut = true;
    }

    private pad(value: number): string {
        return value < 10 ? `0${value}` : `${value}`;
    }

    // -------------------- DATE INIT (SSR SAFE) --------------------

    private initializeMoveOutDate(): void {
        // Now handled via router state in ngOnInit
        // If not already set by nav state, use fallback
        if (this.moveOutDate) return;

        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 58);
        this.moveOutDateTime = fallback;
        this.moveOutDate = this.formatDate(fallback);
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }

    // -------------------- UI ACTIONS --------------------

    goBack() { this.location.back(); }
    openNotifications() { this.router.navigate(['/notifications']); }
    confirmMoveOut() { this.isConfirmed = true; }
    changeMoveOutDate() { this.router.navigate(['/notice']); }
    seeWhatsNext() { this.router.navigate(['/whats-next']); }

    moveOut() {
        this.router.navigate(['/move-out-success'], {
            state: {
                moveOutDate: this.moveOutDate,
                moveOutDateTime: this.moveOutDateTime.toISOString()
            }
        });
    }

    onCountdownComplete() { this.canMoveOut = true; }
}
