import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Ticket } from '../models/ticket';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
    tickets$ = this.ticketsSubject.asObservable();

    constructor(private http: HttpClient) { }

    getTicketsByBooking(bookingId: string): Observable<Ticket[]> {
        return this.http.get<Ticket[]>(`${environment.apiUrl}/tickets/${bookingId}`, { withCredentials: true }).pipe(
            tap(tickets => {
                this.ticketsSubject.next(tickets);
            }),
            catchError(err => {
                console.error('TicketService: Error fetching tickets:', err);
                return of([]);
            })
        );
    }

    raiseTicket(payload: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/tickets/raise`, payload, { withCredentials: true });
    }

    // Legacy method for backward compatibility
    addTicketLocally(ticket: Ticket) {
        const current = this.ticketsSubject.value;
        this.ticketsSubject.next([ticket, ...current]);
    }
}
