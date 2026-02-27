import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BookingInfo {
    id: string;
    displayName: string;
    tenantName?: string;
    sso_token?: string;
}

export interface BookingsApiResponse {
    success: boolean;
    bookings: BookingInfo[];
    message: string | null;
}

export interface TenantDetailsResponse {
    success: boolean;
    bookingId: string;
    tenantName: string | null;
    message: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private selectedBookingSubject = new BehaviorSubject<BookingInfo | null>(null);
    private bookingsSubject = new BehaviorSubject<BookingInfo[]>([]);
    private readonly STORAGE_KEY = 'selectedBookingId';
    private isBrowser: boolean;

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private http: HttpClient
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.loadFromStorage();
        if (this.isBrowser) {
            this.restoreSession().subscribe();
        }
        this.loadAvatarFromStorage();
    }

    /**
     * Restore session using secure cookie
     */
    restoreSession(): Observable<BookingsApiResponse> {
        const url = `${environment.apiUrl}/auth/me`;
        return this.http.get<BookingsApiResponse>(url, { withCredentials: true }).pipe(
            map(response => {
                if (response.success && response.bookings.length > 0) {
                    this.bookingsSubject.next(response.bookings);

                    // If no booking selected yet, or selected booking not in list, select first
                    const current = this.selectedBookingSubject.value;
                    if (current) {
                        const found = response.bookings.find(b => b.id === current.id);
                        if (found) {
                            this.selectedBookingSubject.next(found);
                        } else {
                            this.setSelectedBooking(response.bookings[0]);
                        }
                    } else {
                        this.setSelectedBooking(response.bookings[0]);
                    }
                }
                return response;
            }),
            catchError(error => {
                console.error('Session restoration failed:', error);
                return of({ success: false, bookings: [], message: null });
            })
        );
    }

    /**
     * Fetch bookings from API by phone number
     * Returns an observable with the API response
     */
    fetchBookingsByPhone(phone: string): Observable<BookingsApiResponse> {
        const url = `${environment.apiUrl}/bookings?phone=${encodeURIComponent(phone)}`;

        return this.http.get<BookingsApiResponse>(url, { withCredentials: true }).pipe(
            map(response => {
                if (response.success && response.bookings.length > 0) {
                    // Store bookings in session
                    this.storeBookings(response.bookings);
                }
                return response;
            }),
            catchError(error => {
                console.error('Error fetching bookings:', error);
                // Return error response
                return of({
                    success: false,
                    bookings: [],
                    message: 'Unable to connect to server. Please try again.'
                });
            })
        );
    }

    /**
     * Fetch tenant details (name, company) by booking ID from API
     */
    fetchTenantDetails(bookingId: string): Observable<TenantDetailsResponse> {
        const url = `${environment.apiUrl}/tenant-details?booking_id=${encodeURIComponent(bookingId)}`;

        return this.http.get<TenantDetailsResponse>(url, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error fetching tenant details:', error);
                return of({
                    success: false,
                    bookingId: bookingId,
                    tenantName: null,
                    message: 'Unable to fetch tenant details'
                });
            })
        );
    }

    /**
     * Store fetched bookings (InMemory only)
     */
    private storeBookings(bookings: BookingInfo[]): void {
        this.bookingsSubject.next(bookings);
    }

    /**
     * Get the current selected booking as an Observable
     */
    getSelectedBooking(): Observable<BookingInfo | null> {
        return this.selectedBookingSubject.asObservable();
    }

    /**
     * Get the current selected booking value synchronously
     */
    getSelectedBookingValue(): BookingInfo | null {
        return this.selectedBookingSubject.value;
    }

    /**
     * Set the selected booking and persist to storage
     */
    setSelectedBooking(booking: BookingInfo): void {
        this.selectedBookingSubject.next(booking);
        if (this.isBrowser) {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(booking));
        }
    }

    /**
     * Clear the selected booking and session (for logout)
     */
    clearSelectedBooking(): void {
        this.selectedBookingSubject.next(null);
        this.bookingsSubject.next([]);
        if (this.isBrowser) {
            sessionStorage.removeItem(this.STORAGE_KEY);
        }
    }

    /**
     * Load booking from session storage on service initialization
     */
    private loadFromStorage(): void {
        if (this.isBrowser) {
            const stored = sessionStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                try {
                    const booking = JSON.parse(stored) as BookingInfo;
                    this.selectedBookingSubject.next(booking);
                } catch (e) {
                    console.error('Failed to parse stored booking:', e);
                }
            }
        }
    }

    /**
     * Get bookings for user - returns from stored bookings
     * Use fetchBookingsByPhone() to get fresh data from API
     */
    getBookingsForUser(): BookingInfo[] {
        return this.bookingsSubject.value;
    }

    /**
     * Check if user has multiple bookings
     */
    hasMultipleBookings(): boolean {
        return this.bookingsSubject.value.length > 1;
    }

    /* ================= AVATAR MANAGEMENT ================= */
    private avatarSubject = new BehaviorSubject<string>('assets/images/boy-avatar.png');
    private readonly AVATAR_KEY = 'userAvailableAvatar';

    getAvatar(): Observable<string> {
        return this.avatarSubject.asObservable();
    }

    setAvatar(avatarUrl: string): void {
        this.avatarSubject.next(avatarUrl);
        if (this.isBrowser) {
            localStorage.setItem(this.AVATAR_KEY, avatarUrl);
        }
    }

    private loadAvatarFromStorage(): void {
        if (this.isBrowser) {
            const saved = localStorage.getItem(this.AVATAR_KEY);
            if (saved) {
                this.avatarSubject.next(saved);
            } else {
                // Default to male avatar if nothing saved
                this.avatarSubject.next('assets/images/boy-avatar.png');
            }
        }
    }
}
