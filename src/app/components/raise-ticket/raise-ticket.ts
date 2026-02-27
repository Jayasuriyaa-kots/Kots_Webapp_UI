import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket';
import { BookingService } from '../../services/booking';
import { Ticket } from '../../models/ticket';

// SERVICE_TYPE_MAP: subcategory -> { layout, classification }
const SERVICE_TYPE_MAP: { [key: string]: { layout: string; classification: string } } = {
    // Flat Repairs and Maintenance
    "Plumbing Issue": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Electrical Issue": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Carpenter Issue": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Appliance Issues": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Furniture and Fittings": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Structural Issues": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Doors and Windows": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Pests Ants and Rats": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Water Quality Issue": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Make Duplicate Keys": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Post Checkin CIR Issues": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },
    "Other Flat Issues": { layout: "Tenant SRs", classification: "AO-Flat Repairs and Maintenance" },

    // Customization
    "New Installation": { layout: "Tenant SRs", classification: "AO-Flat Customization and Installations" },
    "Change of Setup": { layout: "Tenant SRs", classification: "AO-Flat Customization and Installations" },
    "AC Installation": { layout: "Tenant SRs", classification: "AO-Flat Customization and Installations" },
    "Kitchen Granite Hole": { layout: "Tenant SRs", classification: "AO-Flat Customization and Installations" },
    "Washing Machine Provision": { layout: "Tenant SRs", classification: "AO-Flat Customization and Installations" },
    "Personal Wifi Installation": { layout: "Tenant SRs", classification: "AO-Flat Customization and Installations" },
    "Other Customizations": { layout: "Tenant SRs", classification: "AO-Flat Customization and Installations" },

    // Common Area
    "Common area Repairs": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Common area Cleanliness": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "CCTV Footage Request": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Courier and Parcel Issues": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Building Staff Issue": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Neighbour Tenant Issues": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Garbage": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Parking Issues": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Additional Services Issues": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Laundry and Gym Issues": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Outside Property issues": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Common Area Rules": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },
    "Other Common Area Issues": { layout: "Tenant SRs", classification: "AO-Common Area Issues" },

    // Wifi
    "Wifi Speed Issue": { layout: "Tenant SRs", classification: "CO-Wifi Issues" },
    "Wifi Limit Exhausted": { layout: "Tenant SRs", classification: "CO-Wifi Issues" },
    "Reshare Wifi Password": { layout: "Tenant SRs", classification: "CO-Wifi Issues" },
    "Wifi Disconnection": { layout: "Tenant SRs", classification: "CO-Wifi Issues" },
    "Wifi Login issue": { layout: "Tenant SRs", classification: "CO-Wifi Issues" },
    "Other Wifi Issue": { layout: "Tenant SRs", classification: "CO-Wifi Issues" },

    // Check-in/Check-out
    "Check In Process": { layout: "Tenant SRs", classification: "CO-Checkin - Checkout Process" },
    "Check Out Process": { layout: "Tenant SRs", classification: "CO-Checkin - Checkout Process" },
    "Denied CheckOut": { layout: "Tenant SRs", classification: "CO-Checkin - Checkout Process" },

    // Additional Services
    "Car Parking": { layout: "Tenant SRs", classification: "CO-Additional Services Issues" },
    "Duplicate Keys": { layout: "Tenant SRs", classification: "CO-Additional Services Issues" },
    "Vehicle Wash": { layout: "Tenant SRs", classification: "CO-Additional Services Issues" },
    "Water Can Service": { layout: "Tenant SRs", classification: "CO-Additional Services Issues" },
    "Food Service": { layout: "Tenant SRs", classification: "CO-Additional Services Issues" },
    "Other Issues Additional Services": { layout: "Tenant SRs", classification: "CO-Additional Services Issues" },

    // Callback
    "CRA Call Back": { layout: "Tenant SRs", classification: "Call Back Request" },

    // General / Billing
    "General Queries": { layout: "Tenant SRs", classification: "CO-General Queries - Others" },
    "Add Co-Occupant/Spintly Access": { layout: "Tenant SRs", classification: "CO-General Queries - Others" },
    "Rental Contract Queries": { layout: "Billing, Payment & Contract", classification: "" },
    "Utility Related Queries": { layout: "Billing, Payment & Contract", classification: "" },
    "Wifi Consumption Report": { layout: "Billing, Payment & Contract", classification: "" },
    "Arrears - Rental Queries": { layout: "Billing, Payment & Contract", classification: "" },
    "Payment Receipt and Invoice": { layout: "Billing, Payment & Contract", classification: "" },
};

@Component({
    selector: 'app-raise-ticket',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './raise-ticket.html',
    styleUrls: ['./raise-ticket.css']
})
export class RaiseTicketComponent {

    // Build categories and subcategories from SERVICE_TYPE_MAP
    categories: string[] = [];
    subcategories: { [key: string]: string[] } = {};

    selectedCategory: string = '';
    selectedSubcategory: string = '';
    description: string = '';
    availableSubcategories: string[] = [];
    uploadedPhotos: { file: File; preview: string; name: string }[] = [];
    isSubmitting: boolean = false;
    bookingId: string = '';

    constructor(
        private ticketService: TicketService,
        private bookingService: BookingService,
        private router: Router,
        private location: Location
    ) {
        this.buildCategoriesFromMap();
        const booking = this.bookingService.getSelectedBookingValue();
        this.bookingId = booking?.id || '';
    }

    private buildCategoriesFromMap() {
        const categoryMap: { [classification: string]: string[] } = {};

        for (const [subcategory, meta] of Object.entries(SERVICE_TYPE_MAP)) {
            const category = meta.classification || meta.layout;
            if (!categoryMap[category]) {
                categoryMap[category] = [];
            }
            categoryMap[category].push(subcategory);
        }

        this.categories = Object.keys(categoryMap);
        this.subcategories = categoryMap;
    }

    onCategoryChange() {
        this.availableSubcategories = this.subcategories[this.selectedCategory] || [];
        this.selectedSubcategory = '';
    }

    goBack() {
        this.location.back();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.uploadedPhotos.push({
                            file: file,
                            preview: e.target?.result as string,
                            name: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
        input.value = '';
    }

    removePhoto(index: number) {
        this.uploadedPhotos.splice(index, 1);
    }

    submitTicket() {
        if (!this.selectedCategory || !this.selectedSubcategory || !this.description) {
            console.warn('Please fill in all fields');
            return;
        }

        if (this.isSubmitting) return;
        this.isSubmitting = true;

        // Get booking ID from session
        const booking = this.bookingService.getSelectedBookingValue();
        const bookingId = booking?.id || '';

        // Look up layout and classification from the map
        const meta = SERVICE_TYPE_MAP[this.selectedSubcategory];

        // Build the webhook payload (matches expected format exactly)
        const webhookPayload = {
            timestamp: new Date().toISOString(),
            phone: '', // Backend will override with cookie session
            servicetype: this.selectedSubcategory,
            subcategory: this.selectedSubcategory,
            servicetranscript: this.description,
            call_transcript: null,
            booking_id: bookingId,
            channel: 'Mobile App',
            layout: meta?.layout || '',
            classification: meta?.classification || '',
        };

        console.log('Submitting ticket webhook payload:', webhookPayload);

        this.ticketService.raiseTicket(webhookPayload).subscribe({
            next: (response: any) => {
                console.log('Webhook response:', response);

                // Store locally for immediate ticket history display
                const localTicket: Ticket = {
                    id: `K${Math.floor(Math.random() * 10000000)}`,
                    ticket_number: `K${Math.floor(Math.random() * 10000000)}`,
                    booking_id: bookingId,
                    classification: meta?.classification || '',
                    category: this.selectedCategory,
                    issue_description: this.description,
                    status: 'Open',
                    final_resolution_message: null,
                    final_resolution_at: null,
                    created_at: new Date().toISOString(),

                    // Legacy fields for backward compatibility
                    serviceType: this.selectedSubcategory,
                    subcategory: this.selectedSubcategory,
                    layout: meta?.layout || '',
                    description: this.description,
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' }),
                    statusDate: ''
                };
                this.ticketService.addTicketLocally(localTicket);

                this.router.navigate(['/ticket-success'], {
                    state: {
                        ticketId: localTicket.id,
                        serviceType: localTicket.serviceType
                    }
                });
            },
            error: (err: any) => {
                console.error('Error submitting ticket:', err);
                this.isSubmitting = false;
            }
        });
    }
}
