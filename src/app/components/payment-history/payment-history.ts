import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentService } from '../../services/payment';
import { Invoice } from '../../models/payment';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-payment-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment-history.html',
    styleUrls: ['./payment-history.css']
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {

    invoices: Invoice[] = [];
    loading = true;
    error = '';
    currentBookingId = '';
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
                this.currentBookingId = booking.id;
                this.loadInvoices(booking.id);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }

    loadInvoices(bookingId: string): void {
        this.loading = true;
        this.error = '';

        this.paymentService.getInvoices(bookingId).subscribe({
            next: (response) => {
                if (response.success) {
                    // Filter to only show Paid invoices in history
                    this.invoices = response.invoices.filter(inv => inv.status === 'Paid');
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
                console.error('Error loading invoices:', err);
            }
        });
    }

    /** Format a due_date string (e.g. "2023-05-01") into month + year display */
    formatDueDate(dateStr: string | null): { month: string; year: string } {
        if (!dateStr) return { month: '', year: '' };
        try {
            const date = new Date(dateStr);
            const month = date.toLocaleString('en-US', { month: 'long' });
            const year = date.getFullYear().toString();
            return { month, year };
        } catch {
            return { month: dateStr, year: '' };
        }
    }

    /** Format a datetime string for display */
    formatDate(dateStr: string | null): string {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        } catch {
            return dateStr;
        }
    }

    /** Download/view a PDF via presigned URL */
    downloadInvoice(invoiceId: number): void {
        if (!invoiceId || !isPlatformBrowser(this.platformId)) return;

        this.paymentService.getInvoiceAccessUrl(invoiceId).subscribe({
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

    goBack(): void {
        this.location.back();
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }

    payRent(): void {
        this.router.navigate(['/pay-rent']);
    }
}
