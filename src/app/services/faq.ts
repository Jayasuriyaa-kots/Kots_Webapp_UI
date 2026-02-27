import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

@Injectable({
    providedIn: 'root'
})
export class FAQService {

    /**
     * Mock API: Get list of FAQs
     */
    getFAQs(): Observable<FAQ[]> {
        // Mock data - will be replaced with real API call
        const mockFAQs: FAQ[] = [
            {
                id: '1',
                question: 'What is the application process like?',
                answer: 'The application process is typically like a KYC process to get to know our customers.'
            },
            {
                id: '2',
                question: 'What are the common lease terms?',
                answer: 'The rental contract is for a standard of 11 months. However, you can choose how long you want to stay.'
            },
            {
                id: '3',
                question: 'Can I renew my lease at the end of the term?',
                answer: 'Yes, you have the option to renew your rental agreement whenever you wish to.'
            },
            {
                id: '4',
                question: 'Is there any Commitment/Lock in period?',
                answer: 'Lock in period is a commitment given by the tenants to us in order to avail free common area maintenance charge. Lock-in period should be a minimum of 6 months to avail free common area maintenance charge.'
            },
            {
                id: '5',
                question: 'Can you renew or update only the lock in period?',
                answer: 'No, once the contract is made you cannot update or change the lock-in period or any other terms.'
            },
            {
                id: '6',
                question: 'Are they any hidden charges?',
                answer: 'Being fair &transparent is our core value and we inform all our tenants about our terms &conditions in detail prior to the booking. There are no hidden charges or terms.'
            },
            {
                id: '7',
                question: 'What is the difference between contract period and lock-in period?',
                answer: 'Both aspects operate independently. Contract period is the 11 month legal term under which tenants will rent the flat with KOTS. Renewal of contracts is possible. On the other hand, the lock-in period refers to the duration for which the tenant commits to remain without terminating the contract, enabling them to take advantage of the free common area maintenance charges offered.'
            },
            {
                id: '8',
                question: 'What happens if you terminate the contract (or) vacate the home during the Lock-In period ?',
                answer: 'The common area maintenance charges offered will be reversed and you will be charged monthly common area maintenance charges for the entire stay duration.'
            },
            {
                id: '9',
                question: 'Is there any notice period to terminate the contract?',
                answer: 'Yes, the tenants have to serve 45 days notice period before they terminate the contract.'
            },
            {
                id: '10',
                question: 'Are there any painting charges or move out charges?',
                answer: 'Move out charges include painting charges to be paid (one time) by the Sub-Lessee in advance or in pre-paid manner at the time of booking the flat. If the rented flat is of Studio / 1BHK flat, painting charges are Rs 14,500 (Fourteen thousand five hundred.) and if the rented flat is a 2BHK flat, painting charges are Rs 19,500 (Nineteen thousand five hundred.).'
            }
        ];

        // Simulate API delay
        return of(mockFAQs).pipe(delay(500));
    }
}
