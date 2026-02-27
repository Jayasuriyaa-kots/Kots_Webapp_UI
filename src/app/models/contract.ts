export interface BookingDetails {
    bookingId: string;
    contractStartDate: string;
    contractEndDate: string;
    lockInPeriod: string;
    lockInEndDate: string;
    noticeStatus: string;
    contractTerminationDate: string;
}

export interface FlatDetails {
    flatNumber: string;
    block: string;
    propertyName: string;
    address: string;
}

export interface ContractDetails {
    booking: BookingDetails;
    flat: FlatDetails;
}
