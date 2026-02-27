import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SplintyUser {
    name: string;
    phone?: string;
    avatar: string;
}

export interface OccupancyResponse {
    success: boolean;
    max_occupancy?: string;
    co_occupants: SplintyUser[];
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SplintyService {

    constructor(private http: HttpClient) { }

    /**
     * Get list of users with Splinty access (co-occupants) and max occupancy
     */
    getOccupancyDetails(bookingId: string): Observable<OccupancyResponse> {
        return this.http.get<OccupancyResponse>(`${environment.apiUrl}/occupancy?booking_id=${bookingId}`, { withCredentials: true });
    }
}
