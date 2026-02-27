import {
    Component,
    OnInit,
    Inject,
    PLATFORM_ID,
    ViewChild,
    ElementRef,
    AfterViewInit
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BookingService } from '../../services/booking';
import { ThemeService } from '../../services/theme';

@Component({
    selector: 'app-otp',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './otp.html',
    styleUrls: ['./otp.css']
})
export class OtpComponent implements OnInit, AfterViewInit {

    @ViewChild('otp1') otp1!: ElementRef<HTMLInputElement>;
    @ViewChild('otp2') otp2!: ElementRef<HTMLInputElement>;
    @ViewChild('otp3') otp3!: ElementRef<HTMLInputElement>;
    @ViewChild('otp4') otp4!: ElementRef<HTMLInputElement>;
    @ViewChild('otp5') otp5!: ElementRef<HTMLInputElement>;
    @ViewChild('otp6') otp6!: ElementRef<HTMLInputElement>;

    phoneNumber = '';
    maskedPhone = '';
    errorMessage = '';
    successMessage = '';
    isLoading = false;
    inputs: HTMLInputElement[] = [];

    constructor(
        private router: Router,
        private bookingService: BookingService,
        private themeService: ThemeService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit() {
        // Set dark grey background for OTP page
        this.themeService.setDarkGreyTheme();

        if (isPlatformBrowser(this.platformId)) {
            const state = history.state;
            if (state?.phoneNumber) {
                this.phoneNumber = state.phoneNumber;
                this.maskedPhone = this.phoneNumber.slice(0, 5) + '*****';
            } else {
                this.router.navigate(['/login']);
            }
        }
    }

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            // Cache input references for better performance
            this.inputs = [
                this.otp1.nativeElement,
                this.otp2.nativeElement,
                this.otp3.nativeElement,
                this.otp4.nativeElement,
                this.otp5.nativeElement,
                this.otp6.nativeElement
            ];

            setTimeout(() => this.inputs[0]?.focus(), 100);
        }
    }

    // Handle value changes (typing, autofill, etc.)
    onInput(index: number) {
        if (!this.inputs.length) return;

        const input = this.inputs[index];
        if (!input) return;

        const value = input.value;

        if (value.length >= 1) {
            // Just take the last character if multiple exist
            if (value.length > 1) {
                input.value = value.slice(-1);
            }

            if (index < 5) {
                this.inputs[index + 1]?.focus();
            } else {
                this.confirmOtp();
            }
        }
    }

    // Handle navigation and backspace
    onKeyDown(event: KeyboardEvent, index: number) {
        if (!this.inputs.length) return;

        const input = this.inputs[index];
        if (!input) return;

        if (event.key === 'Backspace') {
            if (input.value === '') {
                if (index > 0) {
                    this.inputs[index - 1]?.focus();
                }
            }
        } else if (event.key === 'ArrowLeft' && index > 0) {
            this.inputs[index - 1]?.focus();
        } else if (event.key === 'ArrowRight' && index < 5) {
            this.inputs[index + 1]?.focus();
        }
    }

    onPaste(event: ClipboardEvent) {
        event.preventDefault();
        const data = event.clipboardData?.getData('text') || '';
        const digits = data.replace(/\D/g, '').slice(0, 6).split('');

        digits.forEach((d: string, i: number) => {
            if (this.inputs[i]) {
                this.inputs[i].value = d;
            }
        });

        if (digits.length === 6) {
            this.confirmOtp();
        } else if (digits.length > 0) {
            const nextIndex = Math.min(digits.length, 5);
            this.inputs[nextIndex]?.focus();
        }
    }

    confirmOtp() {
        // Ensure inputs array is populated (may be empty if called before ngAfterViewInit)
        if (!this.inputs.length && isPlatformBrowser(this.platformId)) {
            this.inputs = [
                this.otp1?.nativeElement,
                this.otp2?.nativeElement,
                this.otp3?.nativeElement,
                this.otp4?.nativeElement,
                this.otp5?.nativeElement,
                this.otp6?.nativeElement
            ].filter(el => !!el);
        }

        const otp = this.inputs
            .map(i => i.value)
            .join('');

        if (otp.length !== 6) {
            this.errorMessage = 'Please enter the complete 6-digit OTP';
            return;
        }

        this.errorMessage = '';
        this.successMessage = 'OTP verified';
        this.isLoading = true;

        // Fetch bookings from API - identity is now handled by cookie sessions
        this.fetchBookingsAndNavigate();
    }

    /**
     * Fetch bookings from API and navigate based on result
     */
    private fetchBookingsAndNavigate(): void {
        this.bookingService.fetchBookingsByPhone(this.phoneNumber).subscribe({
            next: (response) => {
                this.isLoading = false;

                if (!response.success) {
                    // Phone number not registered
                    this.errorMessage = response.message || 'Enter registered mobile number';
                    this.successMessage = '';
                    return;
                }

                const bookings = response.bookings;

                if (bookings.length === 0) {
                    // No bookings found
                    this.errorMessage = 'Enter registered mobile number';
                    this.successMessage = '';
                    return;
                }

                if (bookings.length === 1) {
                    // Single booking - select it and go to home
                    this.bookingService.setSelectedBooking(bookings[0]);
                    this.router.navigate(['/home']);
                } else {
                    // Multiple bookings - go to selection screen
                    this.router.navigate(['/select-booking']);
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = 'Unable to verify. Please try again.';
                this.successMessage = '';
                console.error('API Error:', error);
            }
        });
    }
}
