import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../services/booking';

@Component({
    selector: 'app-service-details',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './service-details.html',
    styleUrls: ['./service-details.css']
})
export class ServiceDetailsComponent implements OnInit {

    serviceId: string = '';
    serviceName: string = 'Service';
    serviceImage: string = 'assets/images/service.png';
    activeRequests: any[] = [];
    userId: string = '';

    // Map IDs to readable names
    private serviceNames: { [key: string]: string } = {
        'housekeeping': 'House Keeping',
        'managed': 'Managed Services',
        'vehicle': 'Vehicle Wash',
        'water': 'Water Can'
    };

    // Map IDs to images
    private serviceImages: { [key: string]: string } = {
        'housekeeping': 'assets/images/houseservice.png',
        'managed': 'assets/images/managed-service.png',
        'vehicle': 'assets/images/carwash.png',
        'water': 'assets/images/watercan.png'
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private bookingService: BookingService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.serviceId = params['id'];
            this.serviceName = this.serviceNames[this.serviceId] || 'Service Details';
            this.serviceImage = this.serviceImages[this.serviceId] || 'assets/images/service.png';
        });

        // Load Booking ID
        const booking = this.bookingService.getSelectedBookingValue();
        if (booking) {
            this.userId = booking.id;
        }
    }

    goBack() {
        this.router.navigate(['/services']);
    }

    startNewService() {
        this.router.navigate(['/services', this.serviceId, 'book']);
    }

    openNotifications() {
        this.router.navigate(['/notifications']);
    }

    viewHistory() {
        // Navigate to service history (can be implemented later)
        console.log(`View ${this.serviceName} history`);
    }
}
