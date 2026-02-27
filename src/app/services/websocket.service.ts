import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { BookingService } from './booking';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
    private socket: WebSocket | null = null;
    private notificationSubject = new Subject<any>();
    public notifications$ = this.notificationSubject.asObservable();
    private reconnectInterval = 5000;
    private bookingId: string | null = null;

    constructor(private bookingService: BookingService) {
        this.bookingService.getSelectedBooking().subscribe((booking: any) => {
            if (booking) {
                this.bookingId = booking.id;
                this.connect();
            } else {
                this.bookingId = null;
                this.disconnect();
            }
        });
    }

    private connect() {
        if (!this.bookingId) return;
        this.disconnect();

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // environment.apiUrl is usually like http://localhost:8000/api
        // We need to transform it to ws://localhost:8000/ws/notifications
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/notifications/${this.bookingId}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                this.notificationSubject.next(data);
            } catch (e) {
                console.error('Error parsing WebSocket message', e);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.socket.onerror = (error: Event) => {
            console.error('WebSocket error:', error);
            this.socket?.close();
        };
    }

    private disconnect() {
        if (this.socket) {
            this.socket.onclose = null; // Prevent auto-reconnect
            this.socket.close();
            this.socket = null;
        }
    }

    ngOnDestroy() {
        this.disconnect();
    }
}
