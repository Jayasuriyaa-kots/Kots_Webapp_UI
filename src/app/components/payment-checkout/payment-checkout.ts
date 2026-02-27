import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../services/booking';
import { PaymentService } from '../../services/payment';
import { Invoice } from '../../models/payment';

@Component({
    selector: 'app-payment-checkout',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment-checkout.html',
    styleUrls: ['./payment-checkout.css']
})
export class PaymentCheckoutComponent implements OnInit {

    totalAmount: number = 0;
    bookingId: string = '';
    invoiceId: number | null = null;
    invoice: Invoice | null = null;
    loading = true;
    processingPayment = false;

    constructor(
        private location: Location,
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
                this.loadInvoiceDetails();
            } else {
                this.loading = false;
            }
        });
    }

    loadInvoiceDetails(): void {
        if (!this.bookingId) {
            this.loading = false;
            return;
        }

        this.paymentService.getPendingInvoices(this.bookingId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.invoice = response.invoices.find(inv => inv.id === this.invoiceId) || null;
                    if (this.invoice) {
                        this.totalAmount = parseFloat(this.invoice.total || '0');
                    }
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    goBack(): void {
        this.location.back();
    }

    proceedToPay(): void {
        if (!this.invoiceId || !this.invoice || this.processingPayment) return;
        this.processingPayment = true;

        // Save to localStorage so the invoice shows "Processing" across refreshes
        this.paymentService.markPaymentInitiated(
            this.invoiceId,
            this.invoice.total || '0',
            this.invoice.invoice_number || ''
        );

        // Open the invoice PDF (which contains the EZPay link)
        this.paymentService.getInvoiceAccessUrl(this.invoiceId).subscribe({
            next: (res) => {
                if (res.success && res.url && isPlatformBrowser(this.platformId)) {
                    window.open(res.url, '_blank');
                }
                this.router.navigate(['/payment-success'], {
                    queryParams: { invoiceId: this.invoiceId }
                });
                this.processingPayment = false;
            },
            error: (err) => {
                console.error('Error opening invoice PDF:', err);
                this.processingPayment = false;
                this.router.navigate(['/payment-success'], {
                    queryParams: { invoiceId: this.invoiceId }
                });
            }
        });
    }

    raiseIssue(): void {
        this.router.navigate(['/raise-ticket']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
