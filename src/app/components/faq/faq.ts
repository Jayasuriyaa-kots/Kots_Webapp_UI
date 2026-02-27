import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FAQService, FAQ } from '../../services/faq';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './faq.html',
    styleUrls: ['./faq.css']
})
export class FAQComponent implements OnInit, OnDestroy {

    userId = '';
    faqs: FAQ[] = [];
    loading = true;
    error = '';
    expandedId: string | null = null;
    private bookingSubscription: Subscription | null = null;

    constructor(
        private router: Router,
        private faqService: FAQService,
        private bookingService: BookingService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadUserData();
        this.loadFAQs();
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

    loadFAQs(): void {
        this.loading = true;
        this.error = '';

        this.faqService.getFAQs().subscribe({
            next: (data) => {
                this.faqs = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = 'Failed to load FAQs';
                this.loading = false;
                this.cdr.detectChanges();
                console.error('Error loading FAQs:', err);
            }
        });
    }

    toggleFAQ(id: string): void {
        if (this.expandedId === id) {
            this.expandedId = null;
        } else {
            this.expandedId = id;
        }
    }

    isExpanded(id: string): boolean {
        return this.expandedId === id;
    }

    goBack(): void {
        this.router.navigate(['/profile']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
