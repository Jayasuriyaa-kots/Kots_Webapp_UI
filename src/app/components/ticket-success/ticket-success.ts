import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-ticket-success',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ticket-success.html',
    styleUrls: ['./ticket-success.css']
})
export class TicketSuccessComponent implements OnInit {

    ticketId: string = 'K900182'; // Default/Fallback
    issueReported: string = 'Kitchen tap'; // Default/Fallback
    bookingId: string = '';

    constructor(private router: Router, private bookingService: BookingService) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras?.state) {
            this.ticketId = navigation.extras.state['ticketId'] || this.ticketId;
            this.issueReported = navigation.extras.state['serviceType'] || this.issueReported;
        }
        const booking = this.bookingService.getSelectedBookingValue();
        this.bookingId = booking?.id || '';
    }

    ngOnInit(): void {
    }

    goToHome(): void {
        this.router.navigate(['/home']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }
}
