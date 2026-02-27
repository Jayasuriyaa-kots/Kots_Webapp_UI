import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { InvoiceListResponse } from '../models/payment';

const PROCESSING_KEY = 'kots_payment_processing';

export interface ProcessingPayment {
    invoiceId: number;
    timestamp: number;
    amount: string;
    invoiceNumber: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentService {

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    /**
     * Fetch all invoices for a booking ID from the backend API
     */
    getInvoices(bookingId: string): Observable<InvoiceListResponse> {
        const url = `${environment.apiUrl}/invoices?booking_id=${encodeURIComponent(bookingId)}`;
        return this.http.get<InvoiceListResponse>(url, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error fetching invoices:', error);
                return of({
                    success: false,
                    invoices: [],
                    message: 'Unable to load invoices. Please try again.'
                });
            })
        );
    }

    /**
     * Fetch pending invoices (status = Sent or Overdue) for a booking ID
     */
    getPendingInvoices(bookingId: string): Observable<InvoiceListResponse> {
        const url = `${environment.apiUrl}/invoices/pending?booking_id=${encodeURIComponent(bookingId)}`;
        return this.http.get<InvoiceListResponse>(url, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error fetching pending invoices:', error);
                return of({
                    success: false,
                    invoices: [],
                    message: 'Unable to load pending invoices. Please try again.'
                });
            })
        );
    }

    /**
     * Fetch paid invoices for a booking ID
     */
    getPaidInvoices(bookingId: string): Observable<InvoiceListResponse> {
        const url = `${environment.apiUrl}/invoices/paid?booking_id=${encodeURIComponent(bookingId)}`;
        return this.http.get<InvoiceListResponse>(url, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error fetching paid invoices:', error);
                return of({
                    success: false,
                    invoices: [],
                    message: 'Unable to load paid invoices. Please try again.'
                });
            })
        );
    }

    /**
     * Get a temporary signed URL for an invoice PDF
     */
    getInvoiceAccessUrl(invoiceId: number): Observable<{ success: boolean; url: string; message?: string }> {
        const url = `${environment.apiUrl}/invoices/${invoiceId}/access-url`;
        return this.http.get<{ success: boolean; url: string; message?: string }>(url, { withCredentials: true });
    }

    /* ================= LOCAL PAYMENT TRACKING ================= */

    /**
     * Mark an invoice as "payment initiated" in localStorage.
     * This persists across refreshes until the DB confirms payment.
     */
    markPaymentInitiated(invoiceId: number, amount: string, invoiceNumber: string): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const payments = this.getProcessingPayments();
        // Don't duplicate
        if (!payments.find(p => p.invoiceId === invoiceId)) {
            payments.push({
                invoiceId,
                timestamp: Date.now(),
                amount,
                invoiceNumber
            });
            localStorage.setItem(PROCESSING_KEY, JSON.stringify(payments));
        }
    }

    /**
     * Get all locally-tracked processing payments
     */
    getProcessingPayments(): ProcessingPayment[] {
        if (!isPlatformBrowser(this.platformId)) return [];

        try {
            const data = localStorage.getItem(PROCESSING_KEY);
            if (!data) return [];
            const payments: ProcessingPayment[] = JSON.parse(data);

            // Auto-expire entries older than 48 hours (safety cleanup)
            const cutoff = Date.now() - (48 * 60 * 60 * 1000);
            const valid = payments.filter(p => p.timestamp > cutoff);
            if (valid.length !== payments.length) {
                localStorage.setItem(PROCESSING_KEY, JSON.stringify(valid));
            }
            return valid;
        } catch {
            return [];
        }
    }

    /**
     * Check if a specific invoice has payment initiated locally
     */
    isPaymentProcessing(invoiceId: number): boolean {
        return this.getProcessingPayments().some(p => p.invoiceId === invoiceId);
    }

    /**
     * Remove an invoice from processing (called when DB confirms "Paid")
     */
    clearProcessingPayment(invoiceId: number): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const payments = this.getProcessingPayments().filter(p => p.invoiceId !== invoiceId);
        localStorage.setItem(PROCESSING_KEY, JSON.stringify(payments));
    }

    /**
     * Clean up processing entries for invoices that are no longer pending
     * (i.e., DB has updated to Paid). Call this after fetching fresh data.
     */
    cleanupProcessingPayments(pendingInvoiceIds: number[]): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const payments = this.getProcessingPayments();
        // Keep only entries whose invoiceId is still in the pending list
        const updated = payments.filter(p => pendingInvoiceIds.includes(p.invoiceId));
        if (updated.length !== payments.length) {
            localStorage.setItem(PROCESSING_KEY, JSON.stringify(updated));
        }
    }
}
