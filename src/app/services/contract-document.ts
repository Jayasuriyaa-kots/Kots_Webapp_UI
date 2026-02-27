import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

/* ── Interfaces ── */

export interface SignRequest {
    id: number;
    document_title: string;
    required_date: string | null;
    sign_url: string | null;
}

export interface SignedDocument {
    id: number;
    document_title: string;
    pdf_url: string | null;
    email_received_at: string | null;
}

export interface CirDocument {
    id: number;
    document_title: string;
    pdf_url: string | null;
    email_received_at: string | null;
}

export interface ContractDocumentsResponse {
    success: boolean;
    sign_requests: SignRequest[];
    signed_documents: SignedDocument[];
    cir_documents: CirDocument[];
    message: string | null;
}

/* ── Service ── */

@Injectable({
    providedIn: 'root'
})
export class ContractDocumentService {

    constructor(private http: HttpClient) { }

    /**
     * Fetch contract documents from API grouped into 3 sections
     */
    getContractDocuments(bookingId: string): Observable<ContractDocumentsResponse> {
        const url = `${environment.apiUrl}/contract-documents?booking_id=${encodeURIComponent(bookingId)}`;

        return this.http.get<ContractDocumentsResponse>(url, { withCredentials: true }).pipe(
            catchError(error => {
                console.error('Error fetching contract documents:', error);
                return of({
                    success: false,
                    sign_requests: [],
                    signed_documents: [],
                    cir_documents: [],
                    message: 'Unable to load documents. Please try again.'
                });
            })
        );
    }

    /**
     * Get a temporary signed URL for a document
     */
    getContractDocumentAccessUrl(documentId: number): Observable<{ success: boolean; url: string; message?: string }> {
        const url = `${environment.apiUrl}/contract-documents/${documentId}/access-url`;
        return this.http.get<{ success: boolean; url: string; message?: string }>(url, { withCredentials: true });
    }
}
