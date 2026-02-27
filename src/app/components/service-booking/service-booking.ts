import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-service-booking',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './service-booking.html',
    styleUrls: ['./service-booking.css']
})
export class ServiceBookingComponent implements OnInit {

    serviceId: string = '';
    serviceName: string = '';

    selectedDate: string = '';
    endDate: string = ''; // For managed/vehicle
    minDate: string = '';
    selectedSlot: string = '';
    termsAccepted: boolean = false;

    // Housekeeping
    timeSlots: string[] = ['09:00 AM | 40 min', '09:45 AM | 40 min', '10:40 AM | 40 min', '02:15 PM | 40 min', '03:50 PM | 40 min'];

    // Managed Service Data
    durations = [
        { months: 1, days: 30, price: 5000 },
        { months: 2, days: 60, price: 10000 },
        { months: 3, days: 90, price: 15000 },
        { months: 4, days: 120, price: 20000 },
        { months: 5, days: 150, price: 25000 },
        { months: 6, days: 180, price: 30000 }
    ];
    selectedDuration: any = null; // Default null until selected

    // Vehicle Wash Data
    vehicleTypes = [
        { id: 'car', name: 'Car', price: 600, unit: '/ month' },
        { id: 'bike', name: 'Two wheeler', price: 350, unit: '/ month' }
    ];
    selectedVehicle: any = null;
    vehicleNumber: string = '';

    // Water Can Data
    guidelines = [
        'Maximum 2 water cans can be ordered per request',
        'Delivery will be made within 24 hours of order placement',
        'Please ensure someone is available to receive the delivery',
        'Empty cans must be returned within 7 days of delivery',
        'Service is available on all days except major holidays'
    ];

    basePrice: number = 0;
    gstAmount: number = 0;
    totalAmount: number = 0;

    private serviceNames: { [key: string]: string } = {
        'housekeeping': 'House Keeping',
        'managed': 'Managed Services',
        'vehicle': 'Vehicle Wash',
        'water': 'Water Can'
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        // Set min date to today
        const today = new Date();
        this.minDate = today.toISOString().split('T')[0];
        this.selectedDate = this.minDate;

        this.route.params.subscribe(params => {
            this.serviceId = params['id'];
            this.serviceName = this.serviceNames[this.serviceId] || 'Service Booking';

            this.initDefaults();
            this.calculateBill();
        });
    }

    initDefaults() {
        if (this.serviceId === 'managed') {
            this.selectedDuration = this.durations[0]; // Default 1 month
        } else if (this.serviceId === 'housekeeping') {
            this.basePrice = 330;
        } else if (this.serviceId === 'water') {
            this.basePrice = 50;
        }
        this.updateEndDate();
    }

    selectDuration(duration: any) {
        this.selectedDuration = duration;
        this.updateEndDate();
        this.calculateBill();
    }

    selectVehicle(vehicle: any) {
        this.selectedVehicle = vehicle;
        this.calculateBill();
    }

    updateEndDate() {
        if (!this.selectedDate) return;

        const start = new Date(this.selectedDate);
        let end = new Date(start);

        if (this.serviceId === 'managed' && this.selectedDuration) {
            end.setDate(start.getDate() + this.selectedDuration.days);
        } else if (this.serviceId === 'vehicle') {
            end.setDate(start.getDate() + 30); // Monthly subscription
        } else {
            this.endDate = '';
            return;
        }

        this.endDate = end.toISOString().split('T')[0];
    }

    calculateBill() {
        if (this.serviceId === 'managed') {
            this.basePrice = this.selectedDuration ? this.selectedDuration.price : 0;
        } else if (this.serviceId === 'vehicle') {
            this.basePrice = this.selectedVehicle ? this.selectedVehicle.price : 0;
        }
        // Housekeeping and Water have fixed/default basePrice set in init

        this.gstAmount = Math.round(this.basePrice * 0.18 * 100) / 100;
        this.totalAmount = this.basePrice + this.gstAmount;
    }

    goBack() {
        this.router.navigate(['/services', this.serviceId]);
    }

    selectSlot(slot: string) {
        this.selectedSlot = slot;
    }

    canBook(): boolean {
        if (!this.termsAccepted) return false;

        if (this.serviceId === 'housekeeping') {
            return !!this.selectedDate && !!this.selectedSlot;
        }
        if (this.serviceId === 'managed') {
            return !!this.selectedDate && !!this.selectedDuration;
        }
        if (this.serviceId === 'vehicle') {
            return !!this.selectedDate && !!this.selectedVehicle && !!this.vehicleNumber;
        }
        if (this.serviceId === 'water') {
            return true; // Just terms needed
        }
        return false;
    }

    confirmBooking() {
        if (!this.canBook()) return;

        let msg = `Booking Confirmed!\n${this.serviceName}\nTotal: Rs.${this.totalAmount}`;
        if (this.endDate) msg += `\nValid until: ${this.endDate}`;

        alert(msg);
        this.router.navigate(['/services']);
    }
}
