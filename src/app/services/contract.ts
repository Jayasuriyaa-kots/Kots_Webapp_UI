import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ContractDetails } from '../models/contract';

@Injectable({
    providedIn: 'root'
})
export class ContractService {

    // Mock contract data
    private mockContractDetails: ContractDetails = {
        booking: {
            bookingId: '',
            contractStartDate: '09 Mar 2024',
            contractEndDate: '28 Oct 2024',
            lockInPeriod: '6 months',
            lockInEndDate: '09 Sep 2024',
            noticeStatus: '-',
            contractTerminationDate: '-'
        },
        flat: {
            flatNumber: '204',
            block: 'A',
            propertyName: 'Kots Abode',
            address: 'A404, Kots Abode 15th serein layout, Bellandur, Bangalore - 560066'
        }
    };

    constructor() { }

    /**
     * Get contract details from API
     * Currently returns mock data
     */
    getContractDetails(): Observable<ContractDetails> {
        return of(this.mockContractDetails);
    }

    /**
     * Get booking ID
     */
    getBookingId(): Observable<string> {
        return of(this.mockContractDetails.booking.bookingId);
    }
}

