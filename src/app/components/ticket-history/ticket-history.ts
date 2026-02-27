import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket';
import { Ticket } from '../../models/ticket';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';
import { take, filter } from 'rxjs/operators';

@Component({
    selector: 'app-ticket-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ticket-history.html',
    styleUrls: ['./ticket-history.css']
})
export class TicketHistoryComponent implements OnInit, OnDestroy {

    tickets: Ticket[] = [];
    loading = true;
    userId = '';
    private bookingSubscription: Subscription | null = null;

    constructor(
        private location: Location,
        private ticketService: TicketService,
        private router: Router,
        private bookingService: BookingService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        console.log('TicketHistory: Init');
        // Use take(1) to ensure we only trigger the fetch ONCE even if booking subject emits again
        this.bookingSubscription = this.bookingService.getSelectedBooking().pipe(
            filter(booking => !!booking),
            take(1)
        ).subscribe({
            next: (booking) => {
                if (booking) {
                    console.log('TicketHistory: Booking found', booking.id);
                    this.userId = booking.id;
                    this.fetchTickets(booking.id);
                }
            },
            error: (err) => {
                console.error('TicketHistory: Booking error', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }

    fetchTickets(bookingId: string): void {
        this.loading = true;
        this.ticketService.getTicketsByBooking(bookingId).subscribe({
            next: (data: Ticket[]) => {
                console.log('TicketHistory: API Success, count:', data.length);
                this.tickets = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                console.error('TicketHistory: API Error', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    goBack(): void {
        this.location.back();
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }

    raiseNewTicket(): void {
        this.router.navigate(['/raise-ticket']);
    }

    formatDate(dateStr: string | null): string {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'short' };
            return date.toLocaleDateString('en-US', options);
        } catch (e) {
            return dateStr || '';
        }
    }
}
