export interface AppNotification {
    id: string;
    booking_id: string;
    notification_date: string;
    notification_type: string;
    message: string;
    icon?: string;
    isRead?: boolean; // We'll keep this for UI state even if not in DB yet
    created_at: string;
}
