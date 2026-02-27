import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WifiCredentials {
    wifi_id: string;
    wifi_password: string;
}

export interface WifiApiResponse {
    success: boolean;
    wifi_id: string;
    wifi_password: string;
    message: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class WifiService {

    constructor(private http: HttpClient) { }

    /**
     * Get wifi credentials for a specific booking
     */
    getWifiCredentials(bookingId: string): Observable<WifiApiResponse> {
        const url = `${environment.apiUrl}/wifi?booking_id=${encodeURIComponent(bookingId)}`;

        return this.http.get<WifiApiResponse>(url, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error fetching wifi credentials:', error);
                return of({
                    success: false,
                    wifi_id: '',
                    wifi_password: '',
                    message: 'Unable to connect to server'
                });
            })
        );
    }
}
