import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './profile.html',
    styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit, OnDestroy {

    userName = 'Lysandra Voss';
    userId = '';
    private bookingSubscription: Subscription | null = null;

    menuItems = [
        { icon: 'wifi', title: 'Wifi credentials', route: '/wifi' },
        { icon: 'splinty', title: 'Co-occupants', route: '/splinty' },
        { icon: 'faq', title: 'FAQ', route: '/faq' }
    ];

    constructor(
        private router: Router,
        private bookingService: BookingService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    // Avatar selection
    showAvatarDialog = false;
    currentAvatar = 'assets/images/user-avatar.svg';

    // Available avatars (using placeholders if files don't exist yet)
    avatars = [
        { id: 'male', src: 'assets/images/boy-avatar.png', label: 'Male' },
        { id: 'female', src: 'assets/images/female-avatar.png', label: 'Female' } // User to replace this asset
    ];

    ngOnInit(): void {
        this.loadUserData();

        // Subscribe to avatar changes
        this.bookingService.getAvatar().subscribe(avatar => {
            this.currentAvatar = avatar;
        });

        // Subscribe to booking changes
        this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
            if (booking) {
                this.userId = booking.id;
            }
        });
    }

    loadUserData(): void {
        const booking = this.bookingService.getSelectedBookingValue();
        if (booking) {
            this.userId = booking.id;
        }
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    openNotifications(): void {
        this.router.navigate(['/notifications']);
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.clear();
            localStorage.clear();
        }
        this.router.navigate(['/login']);
    }

    loadSavedAvatar(): void {
        // Now handled by subscription in ngOnInit
    }

    changeProfilePicture(): void {
        this.showAvatarDialog = true;
    }

    selectAvatar(avatarSrc: string): void {
        this.bookingService.setAvatar(avatarSrc);
        this.showAvatarDialog = false;
    }

    closeAvatarDialog(): void {
        this.showAvatarDialog = false;
    }

    ngOnDestroy(): void {
        if (this.bookingSubscription) {
            this.bookingSubscription.unsubscribe();
        }
    }
}
