import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentService } from '../../services/payment';
import { BookingService } from '../../services/booking';
import { Invoice } from '../../models/payment';

@Component({
    selector: 'app-rental-payment',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './rental-payment.html',
    styleUrls: ['./rental-payment.css']
})
export class RentalPaymentComponent implements OnInit, OnDestroy {

    totalAmount: number = 0;
    userId: string = '';
    pendingInvoices: Invoice[] = [];
    loading = true;
    error = '';
    processingInvoiceId: number | null = null;
    private bookingSubscription: Subscription | null = null;

    constructor(
        private location: Location,
        private router: Router,
        private paymentService: PaymentService,
        private bookingService: BookingService,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
            if (booking) {
                this.userId = booking.id;
                this.loadPendingInvoices(booking.id);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }

    private parseAmount(val: string | null): number {
        if (!val) return 0;
        // Remove commas and other non-numeric chars except decimal point
        const cleanVal = val.toString().replace(/,/g, '');
        const amount = parseFloat(cleanVal);
        return isNaN(amount) ? 0 : amount;
    }

    loadPendingInvoices(bookingId: string): void {
        this.loading = true;
        this.error = '';

        this.paymentService.getPendingInvoices(bookingId).subscribe({
            next: (response) => {
                if (response.success) {
                    // Pre-process invoices to ensure total is a parsable number for the template
                    this.pendingInvoices = response.invoices.map(inv => ({
                        ...inv,
                        // Keep original total for calc but ensure it's clean for display if needed
                        numericTotal: this.parseAmount(inv.total),
                        numericBalance: this.parseAmount(inv.balance)
                    }));

                    this.totalAmount = this.pendingInvoices.reduce((sum, inv: any) => {
                        return sum + (inv.numericTotal || 0);
                    }, 0);
                } else {
                    this.error = response.message || 'Failed to load invoices';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = 'Failed to load invoices';
                this.loading = false;
                this.cdr.detectChanges();
                console.error('Error loading pending invoices:', err);
            }
        });
    }

    /** Format due date for display */
    formatDueDate(dateStr: string | null): string {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }

    /** Pay a specific invoice — Directly open PDF link or PPC URL */
    payInvoice(invoice: Invoice): void {
        if (this.processingInvoiceId !== null) return;

        this.processingInvoiceId = invoice.id;
        this.cdr.detectChanges();

        // Determine redirect behavior based on invoice number
        const isPpc = invoice.invoice_number?.toLowerCase().includes('ppc');

        if (isPpc && invoice.dummy_order_code) {
            const ppcUrl = `https://www.kots.world/ppc/${invoice.dummy_order_code}`;

            if (isPlatformBrowser(this.platformId)) {
                window.open(ppcUrl, '_blank');
            }

            this.router.navigate(['/payment-success'], {
                queryParams: { invoiceId: invoice.id }
            });
            this.processingInvoiceId = null;
        } else {
            this.paymentService.getInvoiceAccessUrl(invoice.id).subscribe({
                next: (res) => {
                    if (res.success && res.url && isPlatformBrowser(this.platformId)) {
                        window.open(res.url, '_blank');
                    }

                    this.router.navigate(['/payment-success'], {
                        queryParams: { invoiceId: invoice.id }
                    });

                    this.processingInvoiceId = null;
                },
                error: (err) => {
                    console.error('Error opening invoice PDF:', err);
                    this.router.navigate(['/payment-success'], {
                        queryParams: { invoiceId: invoice.id }
                    });
                    this.processingInvoiceId = null;
                }
            });
        }
    }

    goBack(): void {
        this.location.back();
    }

    raiseIssue(): void {
        this.router.navigate(['/raise-ticket']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
