import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ReferralInviteRequest {
    referee_name: string;
    referee_phone: string;
}

export interface ReferralStats {
    total_earned: number;
    goal_amount: number;
    total_invites: number;
    successful_invites: number;
    pending_invites: number;
    referral_code: string;
    referral_link: string;
}

export interface ReferralItem {
    id: number;
    name: string;
    phone: string;
    status: string;
    clicked_count: number;
    created_at: string;
}

export interface DashboardResponse {
    success: boolean;
    stats: ReferralStats;
    invites: ReferralItem[];
    message?: string;
}

export interface InviteResponse {
    success: boolean;
    message: string;
    referral_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReferralService {
    private apiUrl = `${environment.apiUrl}/referrals`;
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    getDashboard(bookingId: string): Observable<DashboardResponse> {
        console.log('ReferralService: getDashboard called with bookingId:', bookingId);
        return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard?booking_id=${bookingId}`, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error fetching referral dashboard:', error);
                return of({
                    success: false,
                    stats: {
                        total_earned: 0,
                        goal_amount: 25000,
                        total_invites: 0,
                        successful_invites: 0,
                        pending_invites: 0,
                        referral_code: '',
                        referral_link: ''
                    },
                    invites: [],
                    message: 'Failed to load dashboard'
                });
            })
        );
    }

    inviteFriend(bookingId: string, name: string, phone: string): Observable<InviteResponse> {
        const body: ReferralInviteRequest = {
            referee_name: name,
            referee_phone: phone
        };

        return this.http.post<InviteResponse>(`${this.apiUrl}/invite?booking_id=${bookingId}`, body, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error inviting friend:', error);
                return of({
                    success: false,
                    message: 'Failed to send invite'
                });
            })
        );
    }
}
