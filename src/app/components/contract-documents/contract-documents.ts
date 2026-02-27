import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
    ContractDocumentService,
    SignRequest,
    SignedDocument,
    CirDocument
} from '../../services/contract-document';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-contract-documents',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './contract-documents.html',
    styleUrls: ['./contract-documents.css']
})
export class ContractDocumentsComponent implements OnInit, OnDestroy {

    userId = '';
    signRequests: SignRequest[] = [];
    signedDocuments: SignedDocument[] = [];
    cirDocuments: CirDocument[] = [];
    loading = true;
    error = '';
    private bookingSubscription: Subscription | null = null;

    constructor(
        private router: Router,
        private contractDocumentService: ContractDocumentService,
        private bookingService: BookingService,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        this.loadUserData();
    }

    loadUserData(): void {
        this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
            if (booking) {
                this.userId = booking.id;
                this.loadDocuments(booking.id);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }

    loadDocuments(bookingId: string): void {
        this.loading = true;
        this.error = '';

        this.contractDocumentService.getContractDocuments(bookingId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.signRequests = response.sign_requests;
                    this.signedDocuments = response.signed_documents;
                    this.cirDocuments = response.cir_documents;
                } else {
                    this.error = response.message || 'Failed to load documents';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = 'Failed to load documents';
                this.loading = false;
                this.cdr.detectChanges();
                console.error('Error loading documents:', err);
            }
        });
    }

    get hasAnyDocuments(): boolean {
        return this.signRequests.length > 0
            || this.signedDocuments.length > 0
            || this.cirDocuments.length > 0;
    }

    /** Open the Zoho Sign URL in a new tab */
    openSignUrl(url: string | null): void {
        if (!url || !isPlatformBrowser(this.platformId)) return;
        window.open(url, '_blank');
    }

    /** Download/View a PDF by fetching a signed URL */
    downloadPdf(docId: number, title: string): void {
        if (!docId || !isPlatformBrowser(this.platformId)) return;

        // We don't necessarily want to toggle global loading state for a single download, 
        // but we could. For now let's just do the request.

        this.contractDocumentService.getContractDocumentAccessUrl(docId).subscribe({
            next: (res) => {
                if (res.success && res.url) {
                    window.open(res.url, '_blank');
                } else {
                    console.error('Failed to get access URL');
                    // Optional: Show a toast or alert
                }
            },
            error: (err) => {
                console.error('Error fetching access URL:', err);
            }
        });
    }

    /** Format date string for display */
    formatDate(dateStr: string | null): string {
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

    goBack(): void {
        this.router.navigate(['/home']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
