import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-services',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './services.html',
    styleUrls: ['./services.css']
})
export class ServicesComponent implements OnInit, OnDestroy {

    services = [
        {
            id: 'housekeeping',
            title: 'House Keeping',
            image: 'assets/images/housekeeping.png', // Placeholder path
            pricePrefix: 'Starting From ',
            price: 'Rs. 330.00',
            priceSuffix: '/2 BHK'
        },
        {
            id: 'managed',
            title: 'Managed Services',
            image: 'assets/images/managed-service.png',
            pricePrefix: 'Starting From ',
            price: 'Rs. 2800.00',
            priceSuffix: '/ Month'
        },
        {
            id: 'vehicle',
            title: 'Vehicle Wash',
            image: 'assets/images/carwash.png', // Reusing car icon we know exists
            pricePrefix: 'Starting From ',
            price: 'Rs. 350.00',
            priceSuffix: ''
        },
        {
            id: 'water',
            title: 'Water can subscription',
            image: 'assets/images/watercan.png', // Reusing water tank icon
            pricePrefix: '',
            price: 'Rs. 50.00',
            priceSuffix: '/can'
        }
    ];

    userId = '';
    private bookingSubscription: Subscription | null = null;

    constructor(private router: Router, private bookingService: BookingService) { }

    ngOnInit(): void {
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

    goBack() {
        this.router.navigate(['/home']);
    }

    openNotifications() {
        this.router.navigate(['/notifications']);
    }

    selectService(service: any) {
        // Navigate to specific service details
        this.router.navigate(['/services', service.id]);
    }
}
