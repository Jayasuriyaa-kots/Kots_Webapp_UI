import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';

@Component({
    selector: 'app-notice',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './notice.html',
    styleUrls: ['./notice.css']
})
export class NoticeComponent implements OnInit, OnDestroy {
    showWarningModal = true;
    step = 1;

    // Dates
    noticeStartDate = '';
    contractTerminationDate = '';
    moveOutDate = '';

    // Step 2/3 Data
    noticePeriodDate = '';
    step2TerminationDate = '';
    step2MoveOutDate = '';
    moveOutDateTime!: Date; // Track actual Date for countdown

    agreedToTerms = false;
    currentBookingId = '';
    private bookingSubscription: Subscription | null = null;

    constructor(
        private location: Location,
        private router: Router,
        private bookingService: BookingService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        this.initializeDates();

        this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
            if (booking) {
                this.currentBookingId = booking.id;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }

    initializeDates(): void {
        const today = new Date();

        // Notice period date = today
        this.noticeStartDate = this.formatDate(today);
        this.noticePeriodDate = this.formatDate(today);

        // Contract termination date (example: 60 days from today - in real app, this comes from contract)
        const terminationDate = new Date(today);
        terminationDate.setDate(today.getDate() + 60);
        this.contractTerminationDate = this.formatDate(terminationDate);
        this.step2TerminationDate = this.formatDate(terminationDate);

        // Move-out date = 58 days from notice submission
        const moveOut = new Date(today);
        moveOut.setDate(today.getDate() + 58);
        this.moveOutDateTime = moveOut;
        this.moveOutDate = this.formatDate(moveOut);
        this.step2MoveOutDate = this.formatDate(moveOut);
    }

    formatDate(date: Date): string {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    }

    goBack(): void {
        if (this.step === 3) {
            this.step = 2;
        } else if (this.step === 2) {
            this.step = 1;
        } else {
            this.location.back();
        }
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }

    proceedFromModal(): void {
        this.showWarningModal = false;
    }

    goBackFromModal(): void {
        this.location.back();
    }

    goToStep2(): void {
        this.step = 2;
    }

    goToStep3(): void {
        this.step = 3;
    }

    onNoticeStartDateChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.value) {
            const selectedDate = new Date(input.value);
            this.noticeStartDate = this.formatDate(selectedDate);
            this.noticePeriodDate = this.formatDate(selectedDate);

            // Recalculate move-out date (58 days from notice start)
            const moveOut = new Date(selectedDate);
            moveOut.setDate(selectedDate.getDate() + 58);
            this.moveOutDateTime = moveOut;
            this.moveOutDate = this.formatDate(moveOut);
            this.step2MoveOutDate = this.formatDate(moveOut);
        }
    }

    onMoveOutDateChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.value) {
            const selectedDate = new Date(input.value);
            this.moveOutDateTime = selectedDate;
            this.moveOutDate = this.formatDate(selectedDate);
            this.step2MoveOutDate = this.formatDate(selectedDate);
        }
    }

    openNoticeStartPicker(): void {
        const picker = document.getElementById('noticeStartPicker') as HTMLInputElement;
        if (picker) {
            if (typeof picker.showPicker === 'function') {
                picker.showPicker();
            } else {
                picker.click();
            }
        }
    }

    openMoveOutPicker(): void {
        const picker = document.getElementById('moveOutPicker') as HTMLInputElement;
        if (picker) {
            if (typeof picker.showPicker === 'function') {
                picker.showPicker();
            } else {
                picker.click();
            }
        }
    }

    submitNotice(): void {
        if (this.step === 1) {
            this.goToStep2();
        } else if (this.step === 2) {
            this.goToStep3();
        } else {
            console.log('Final Notice submitted');
            // Store the move-out date for the success page to use (browser only)
            // Navigate to confirmed state directly
            this.router.navigate(['/notice-success'], {
                state: {
                    isConfirmed: true,
                    moveOutDate: this.step2MoveOutDate,
                    moveOutDateTime: this.getMoveOutDateTime().toISOString()
                }
            });
        }
    }

    private getMoveOutDateTime(): Date {
        return this.moveOutDateTime;
    }
}
