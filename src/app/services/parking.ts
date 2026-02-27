import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ParkingDetails {
    parking_slot_reserved: boolean;
    total_available_parking_slots: number;
    total_paid_parking_slots: number;
    reserved_parking_slots: number;
    status: string;
}

export interface ParkingStatusResponse {
    success: boolean;
    is_in_waiting_list: boolean;
    waiting_list_number: number | null;
    property_id: number | null;
    parking_details: ParkingDetails | null;
    message: string | null;
}

export interface ParkingRequestResponse {
    success: boolean;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class ParkingService {

    private lastParkingStatus: ParkingStatusResponse | null = null;

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private http: HttpClient
    ) { }

    /**
     * Fetch parking status from API for a given booking ID
     */
    getParkingStatus(bookingId: string): Observable<ParkingStatusResponse> {
        const url = `${environment.apiUrl}/parking-status?booking_id=${encodeURIComponent(bookingId)}`;

        return this.http.get<ParkingStatusResponse>(url, { withCredentials: true }).pipe(
            map(response => {
                this.lastParkingStatus = response;
                return response;
            }),
            catchError(error => {
                console.error('Error fetching parking status:', error);
                return of({
                    success: false,
                    is_in_waiting_list: false,
                    waiting_list_number: null,
                    property_id: null,
                    parking_details: null,
                    message: 'Unable to fetch parking status. Please try again.'
                });
            })
        );
    }

    /**
     * Send a parking request email for a given booking ID
     */
    requestParking(bookingId: string): Observable<ParkingRequestResponse> {
        const url = `${environment.apiUrl}/parking-request?booking_id=${encodeURIComponent(bookingId)}`;

        return this.http.post<ParkingRequestResponse>(url, {}, { withCredentials: true }).pipe(
            timeout(10000),
            catchError(error => {
                console.error('Error sending parking request:', error);
                return of({
                    success: false,
                    message: 'Unable to send parking request. Please try again.'
                });
            })
        );
    }

    /**
     * Cancel a parking request for a given booking ID
     */
    cancelParkingRequest(bookingId: string): Observable<ParkingRequestResponse> {
        const url = `${environment.apiUrl}/cancel-parking-request?booking_id=${encodeURIComponent(bookingId)}`;

        return this.http.post<ParkingRequestResponse>(url, {}, { withCredentials: true }).pipe(
            timeout(10000),
            catchError(error => {
                console.error('Error cancelling parking request:', error);
                return of({
                    success: false,
                    message: 'Unable to cancel parking request. Please try again.'
                });
            })
        );
    }

    /**
     * Get the last fetched parking status (synchronous)
     */
    getLastParkingStatus(): ParkingStatusResponse | null {
        return this.lastParkingStatus;
    }
}

