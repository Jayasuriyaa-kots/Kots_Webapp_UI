import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment';
import { ParkingService } from '../../services/parking';
import { BookingService, BookingInfo } from '../../services/booking';
import { ReferralService } from '../../services/referral';
import { ThemeService } from '../../services/theme';
import { Invoice } from '../../models/payment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  userName = '';
  userId = '';

  userAvatar = 'assets/images/female-avatar.png';

  /* ================= BOOKING DROPDOWN ================= */
  showBookingDropdown = false;
  allBookings: BookingInfo[] = [];
  hasMultipleBookings = false;

  /* ================= PAYMENT ================= */
  paymentStatus: 'paid' | 'pending' | 'overdue' = 'pending';
  rentAmount = 0;
  pendingInvoices: Invoice[] = [];
  paymentDueDate = '';
  penaltyPerDay = 100;

  /* ================= ANNOUNCEMENTS ================= */
  announcements = [
    {
      date: '06/07/2024',
      title: 'Refer & Earn 🎉',
      description: 'Refer a friend and earn exciting bonuses on your next rent payment.',
      icon: '/assets/images/refercard.png',
      action: 'refer'
    },

    {
      date: '05/07/2024',
      title: 'Scheduled Power Outage',
      description: 'This outage is necessary for essential electrical maintenance and upgrades.',
      icon: '/assets/images/electricshock.png'
    },
    {
      date: '05/07/2024',
      title: 'Water Tank Service',
      description: 'Water tanker will be provided daily at 8 AM and 6 PM.',
      icon: '/assets/images/watertank.png'
    },
    {
      date: '06/07/2024',
      title: 'Property Maintenance',
      description: 'Gym will be cleaned today (4PM - 5PM).',
      icon: '/assets/images/gym.png'
    }
  ];

  currentAnnouncementIndex = 0;
  private carouselTimer!: number;

  /* ================= MENU ================= */
  menuItems = [
    { key: 'tickets', title: 'TICKETS', icon: '/assets/images/ticket-history.svg', route: '/tickets' },
    { key: 'refer', title: 'REFER & EARN', icon: '/assets/images/referrall.png', route: '/refer' },
    { key: 'parking', title: 'CAR PARKING', icon: '/assets/images/car-icon.png', route: '/parking' },
    { key: 'contract', title: 'CONTRACT', icon: '/assets/images/contract.svg', route: '/contract-documents' },
    { key: 'services', title: 'SERVICES', icon: '/assets/images/houseservice.png', route: 'https://services.kots.world/' },
    { key: 'payments', title: 'PAYMENT HISTORY', icon: '/assets/images/payment-history.svg', route: '/payments' }
  ];

  constructor(
    private router: Router,
    private paymentService: PaymentService,
    private parkingService: ParkingService,
    private bookingService: BookingService,
    private referralService: ReferralService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  /* ================= LIFECYCLE ================= */

  ngOnInit(): void {
    // Set dark theme for home page
    this.themeService.setDarkTheme();
    this.loadSelectedBooking();
    this.loadAllBookings();
    this.checkPaymentStatus();
    this.startCarousel();

    // Subscribe to avatar changes
    this.bookingService.getAvatar().subscribe(avatar => {
      this.userAvatar = avatar;
    });

    // Fetch tenant name for the selected booking
    this.fetchTenantName();
  }

  /**
   * Load the selected booking ID from the service
   */
  loadSelectedBooking(): void {
    const booking = this.bookingService.getSelectedBookingValue();
    if (booking) {
      this.userId = booking.id;
      if (booking.tenantName) {
        this.userName = booking.tenantName + '!';
      }
    }
  }

  /**
   * Fetch tenant name from API based on current booking ID
   */
  fetchTenantName(): void {
    if (!this.userId) return;

    this.bookingService.fetchTenantDetails(this.userId).subscribe(response => {
      if (response.success && response.tenantName) {
        this.userName = response.tenantName + '!';
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load all bookings for the current user
   */
  loadAllBookings(): void {
    this.allBookings = this.bookingService.getBookingsForUser();
    this.hasMultipleBookings = this.allBookings.length > 1;
  }

  /* ================= BOOKING DROPDOWN ================= */

  toggleBookingDropdown(event: Event): void {
    event.stopPropagation();
    if (this.hasMultipleBookings) {
      this.showBookingDropdown = !this.showBookingDropdown;
    }
  }

  closeBookingDropdown(): void {
    this.showBookingDropdown = false;
  }

  selectBooking(booking: BookingInfo): void {
    this.bookingService.setSelectedBooking(booking);
    this.userId = booking.id;
    this.showBookingDropdown = false;
    // Reload payment status and tenant name for the new booking
    this.checkPaymentStatus();
    this.fetchTenantName();
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
  }

  /* ================= CAROUSEL ================= */

  startCarousel(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.carouselTimer = window.setInterval(() => {
      this.currentAnnouncementIndex =
        (this.currentAnnouncementIndex + 1) % this.announcements.length;
      this.cdr.detectChanges();
    }, 2000);
  }

  goToAnnouncement(index: number): void {
    this.currentAnnouncementIndex = index;
    clearInterval(this.carouselTimer);
    this.startCarousel();
  }

  /* ================= PAYMENT ================= */

  private parseAmount(val: string | null): number {
    if (!val) return 0;
    const cleanVal = val.toString().replace(/,/g, '');
    const amount = parseFloat(cleanVal);
    return isNaN(amount) ? 0 : amount;
  }

  checkPaymentStatus(): void {
    if (!this.userId) return;

    this.paymentService.getPendingInvoices(this.userId).subscribe(response => {
      if (response.success && response.invoices.length > 0) {
        this.pendingInvoices = response.invoices;

        // Sum all pending invoice totals with comma-safe parsing
        this.rentAmount = response.invoices.reduce((sum, inv) => {
          return sum + this.parseAmount(inv.total);
        }, 0);

        // Check if any invoice is overdue
        const hasOverdue = response.invoices.some(inv => inv.status === 'Overdue');
        this.paymentStatus = hasOverdue ? 'overdue' : 'pending';

        // Set due date from the earliest due invoice
        if (response.invoices.length > 0) {
          const earliest = response.invoices[response.invoices.length - 1];
          if (earliest.due_date) {
            const date = new Date(earliest.due_date);
            this.paymentDueDate = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
          }
        }
      } else {
        this.paymentStatus = 'paid';
        this.rentAmount = 0;
        this.pendingInvoices = [];
      }
      this.cdr.detectChanges();
    });
  }

  get showPaymentAlert(): boolean {
    return this.paymentStatus !== 'paid';
  }

  get paymentAlertClass(): string {
    return this.paymentStatus === 'overdue'
      ? 'payment-overdue'
      : 'payment-pending';
  }

  get paymentMessage(): string {
    if (this.paymentStatus === 'overdue') {
      return `Pay now to avoid late payment fees of ₹${this.penaltyPerDay} per day.`;
    }
    return 'Pay now to avoid any extra charges.';
  }

  /* ================= NAVIGATION ================= */

  payRent(): void {
    this.router.navigate(['/pay-rent']);
  }

  openProfile(): void {
    this.router.navigate(['/profile']);
  }

  openNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  openAnnouncements(): void {
    this.router.navigate(['/announcements']);
  }

  navigateToMenu(route: string): void {
    if (route.startsWith('http')) {
      // Handle external redirect for Services (SSO)
      const currentBooking = this.bookingService.getSelectedBookingValue();
      const token = currentBooking?.sso_token;

      if (token && isPlatformBrowser(this.platformId)) {
        window.open(`${route}?token=${token}`, '_blank');
      } else if (isPlatformBrowser(this.platformId)) {
        window.open(route, '_blank');
      }
      return;
    }

    if (route === '/parking') {
      // Call real API to check parking status
      this.parkingService.getParkingStatus(this.userId).subscribe(status => {
        if (!status.success) {
          // No parking record found - show waiting page
          this.router.navigate(['/parking-waiting']);
        } else if (status.is_in_waiting_list) {
          this.router.navigate(['/parking-queue-success']);
        } else {
          this.router.navigate(['/parking']);
        }
      });
    } else {
      this.router.navigate([route]);
    }
  }

  openChatbot(): void {
    this.router.navigate(['/raise-ticket']);
  }

  /* ================= REFERRAL NAVIGATION ================= */

  navigateToReferral(): void {
    this.router.navigate(['/refer']);
  }
  handleAnnouncementClick(announcement: any): void {
    if (announcement.action === 'refer') {
      this.router.navigate(['/refer']);
    } else {
      this.openAnnouncements();
    }
  }

}
