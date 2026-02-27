import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppNotification } from '../models/notification';
import { BookingService } from '../app/services/booking';
import { environment } from '../environments/environment';

export interface NotificationListResponse {
    success: boolean;
    notifications: AppNotification[];
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(
        private http: HttpClient,
        private bookingService: BookingService
    ) { }

    getNotifications(): Observable<AppNotification[]> {
        const booking = this.bookingService.getSelectedBookingValue();
        if (!booking) return of([]);

        const url = `${environment.apiUrl}/notifications?booking_id=${booking.id}`;
        return this.http.get<NotificationListResponse>(url, { withCredentials: true }).pipe(
            map(response => response.success ? response.notifications : []),
            catchError((err: any) => {
                console.error('Error fetching notifications:', err);
                return of([]);
            })
        );
    }

    markAsRead(notificationId: string): void {
        const url = `${environment.apiUrl}/notifications/${notificationId}/read`;
        this.http.put(url, {}, { withCredentials: true }).subscribe({
            error: (err) => console.error('Failed to mark notification as read', err)
        });
    }
}
