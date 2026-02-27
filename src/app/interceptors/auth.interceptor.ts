import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

/**
 * HTTP Interceptor to attach the sso_token as an Authorization header
 * This is needed because cross-origin cookies don't work with self-signed SSL certificates
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);

    // Only intercept API requests
    if (!req.url.startsWith(environment.apiUrl)) {
        return next(req);
    }

    if (isPlatformBrowser(platformId)) {
        const storedBooking = sessionStorage.getItem('selectedBookingId');
        if (storedBooking) {
            try {
                const booking = JSON.parse(storedBooking);
                if (booking.sso_token) {
                    const cloned = req.clone({
                        setHeaders: {
                            Authorization: `Bearer ${booking.sso_token}`
                        }
                    });
                    return next(cloned);
                }
            } catch (e) {
                // ignore parse errors
            }
        }
    }

    return next(req);
};
