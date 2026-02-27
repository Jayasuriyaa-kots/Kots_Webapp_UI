import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../services/booking';
import { PaymentService } from '../../services/payment';

@Component({
    selector: 'app-payment-success',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment-success.html',
    styleUrls: ['./payment-success.css']
})
export class PaymentSuccessComponent implements OnInit {

    bookingId: string = '';
    invoiceId: number | null = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private bookingService: BookingService,
        private paymentService: PaymentService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        const booking = this.bookingService.getSelectedBookingValue();
        this.bookingId = booking?.id || '';
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const id = params['invoiceId'];
            if (id) {
                this.invoiceId = parseInt(id, 10);
            }
        });
    }

    downloadInvoice(): void {
        if (!this.invoiceId || !isPlatformBrowser(this.platformId)) return;

        this.paymentService.getInvoiceAccessUrl(this.invoiceId).subscribe({
            next: (res) => {
                if (res.success && res.url) {
                    window.open(res.url, '_blank');
                } else {
                    console.error('Failed to get invoice access URL');
                }
            },
            error: (err) => {
                console.error('Error fetching invoice access URL:', err);
            }
        });
    }

    backToHome(): void {
        this.router.navigate(['/home']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
