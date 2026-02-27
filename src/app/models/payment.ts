export interface Invoice {
    id: number;
    booking_id: string | null;
    invoice_date: string | null;
    invoice_number: string | null;
    customer_name: string | null;
    total: string | null;
    due_date: string | null;
    balance: string | null;
    status: string | null;
    pdf_url: string | null;
    dummy_order_code?: string;
    numericTotal?: number;
    numericBalance?: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface InvoiceListResponse {
    success: boolean;
    invoices: Invoice[];
    message: string | null;
}
