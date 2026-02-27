import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { NotificationService } from '../../../services/notification';
import { BookingService } from '../../services/booking';
import { WebsocketService } from '../../../app/services/websocket.service';
import { AppNotification } from '../../../models/notification';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notifications.html',
    styleUrls: ['./notifications.css']
})
export class NotificationsComponent implements OnInit {

    notifications: AppNotification[] = [];
    loading = true;
    bookingId = '';

    constructor(
        private location: Location,
        private notificationService: NotificationService,
        private bookingService: BookingService,
        private wsService: WebsocketService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const booking = this.bookingService.getSelectedBookingValue();
        this.bookingId = booking ? booking.id : 'N/A';
        this.fetchNotifications();

        // Listen for real-time updates to refresh the list
        this.wsService.notifications$.subscribe(data => {
            if (data.type === 'NOTIFICATION_RECEIVED') {
                this.fetchNotifications();
            }
        });
    }

    fetchNotifications(): void {
        this.notificationService.getNotifications().subscribe({
            next: (data: AppNotification[]) => {
                this.notifications = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err: unknown) => {
                console.error('Failed to load notifications', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    goBack(): void {
        this.location.back();
    }

    markAsRead(notification: AppNotification): void {
        this.notificationService.markAsRead(notification.id);
        notification.isRead = true;
    }
}
