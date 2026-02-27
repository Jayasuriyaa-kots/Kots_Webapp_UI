import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReferralService, DashboardResponse, ReferralItem } from '../../services/referral';
import { BookingService } from '../../services/booking';

import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-referral',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './referral.html',
    styleUrls: ['./referral.css']
})
export class ReferralComponent implements OnInit {
    isLoading = true;
    bookingId: string = '';
    dashboard?: DashboardResponse;

    // Stats
    totalEarned = 0;
    goalAmount = 25000;
    progressPercent = 0;
    totalInvites = 0;
    successfulInvites = 0;
    pendingInvites = 0;
    referralCode = '';
    referralLink = '';

    // Invites List
    invites: ReferralItem[] = [];
    activeTab: 'joined' | 'pending' = 'pending';

    // Invite Form
    showInviteForm = false;
    inviteName = '';
    invitePhone = '';
    isInviting = false;

    constructor(
        private referralService: ReferralService,
        private bookingService: BookingService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        console.log('ReferralComponent initialized');
        this.bookingService.getSelectedBooking().subscribe(booking => {
            console.log('Selected Booking:', booking);
            if (booking) {
                this.bookingId = booking.id;
                this.loadDashboard();
            } else {
                console.warn('No booking selected, redirecting to home');
                this.router.navigate(['/home']);
            }
        });
    }

    loadDashboard() {
        console.log('Loading dashboard for:', this.bookingId);
        this.isLoading = true;
        this.referralService.getDashboard(this.bookingId).subscribe({
            next: (res) => {
                console.log('Dashboard API Response:', res);
                this.isLoading = false;

                if (res.success) {
                    this.dashboard = res;
                    this.totalEarned = res.stats.total_earned;
                    this.goalAmount = res.stats.goal_amount;
                    this.totalInvites = res.stats.total_invites;
                    this.successfulInvites = res.stats.successful_invites;
                    this.pendingInvites = res.stats.pending_invites;
                    this.referralCode = res.stats.referral_code;
                    this.referralLink = res.stats.referral_link;
                    this.invites = res.invites;

                    // Calculate progress
                    this.progressPercent = Math.min(100, (this.totalEarned / this.goalAmount) * 100);
                } else {
                    console.error('Dashboard API returned success=false:', res.message);
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Dashboard API Subscribe Error:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get filteredInvites() {
        if (this.activeTab === 'joined') {
            return this.invites.filter(i => i.status === 'Successful' || i.status === 'Joined');
        } else {
            return this.invites.filter(i => i.status === 'Pending');
        }
    }

    copyLink() {
        navigator.clipboard.writeText(this.referralLink).then(() => {
            alert('Link copied to clipboard!');
        });
    }

    inviteFriend() {
        if (!this.inviteName || !this.invitePhone) {
            alert('Please enter Name and Phone');
            return;
        }

        this.isInviting = true;
        this.referralService.inviteFriend(this.bookingId, this.inviteName, this.invitePhone).subscribe(res => {
            this.isInviting = false;
            if (res.success && res.referral_id) {
                this.openWhatsApp(this.inviteName, this.invitePhone, res.referral_id);

                // Refresh dashboard
                this.loadDashboard();
                this.inviteName = '';
                this.invitePhone = '';
                this.showInviteForm = false;
            } else {
                alert(res.message || 'Failed to record invite. Please try again.');
            }
        });
    }

    remindFriend(item: ReferralItem) {
        this.openWhatsApp(item.name, item.phone, item.id);
    }

    private openWhatsApp(name: string, phone: string, referralId: number): void {

        // Safety check
        if (!this.dashboard?.stats) {
            console.error('Dashboard not loaded yet');
            return;
        }

        // Hardcode only for WhatsApp link
        const publicBaseUrl = 'https://9a33-106-51-36-241.ngrok-free.app';

        const trackingLink = `${publicBaseUrl}/api/referrals/click/${referralId}`;

        const referralCode = this.dashboard?.stats?.referral_code || '';

        const message = `Hey ${name}, check out these amazing flats!
Use my code ${referralCode} to register:
${trackingLink}`;

        const encodedMessage = encodeURIComponent(message);

        const whatsappUrl = `https://wa.me/91${phone}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    }

    goBack() {
        this.router.navigate(['/home']);
    }
}
