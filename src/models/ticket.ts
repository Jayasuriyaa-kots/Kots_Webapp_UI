export interface Ticket {
    id: number | string;
    ticket_number: string | null;
    booking_id: string | null;
    classification: string | null;
    category: string | null;
    issue_description: string | null;
    status: string | null;
    final_resolution_message: string | null;
    final_resolution_at: string | null;
    created_at: string | null;

    // Legacy fields for backward compatibility
    serviceType?: string;
    subcategory?: string;
    layout?: string;
    description?: string;
    date?: Date | string;
    statusDate?: string;
}
