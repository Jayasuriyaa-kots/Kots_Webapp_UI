import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bank-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-details.html',
  styleUrls: ['./bank-details.css']
})
export class BankDetailsComponent {

  @Output() closeEvent = new EventEmitter<void>();
  @Output() submissionSuccess = new EventEmitter<void>();

  // ---------------- BANK DROPDOWN ----------------
  bankSearch = '';
  selectedBank = '';
  showBankList = false;

  banks: string[] = [
    // Public Sector Banks
    'State Bank of India',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'Indian Bank',
    'Bank of India',
    'Central Bank of India',
    'Indian Overseas Bank',
    'UCO Bank',
    'Bank of Maharashtra',
    'Punjab & Sind Bank',

    // Private Sector Banks
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Yes Bank',
    'IndusInd Bank',
    'IDFC First Bank',
    'Federal Bank',
    'South Indian Bank',
    'RBL Bank',
    'Bandhan Bank',
    'City Union Bank',
    'DCB Bank',
    'Karur Vysya Bank',
    'Tamilnad Mercantile Bank',
    'Karnataka Bank',
    'Jammu & Kashmir Bank',
    'CSB Bank',

    // Small Finance Banks
    'AU Small Finance Bank',
    'Equitas Small Finance Bank',
    'Ujjivan Small Finance Bank',
    'Jana Small Finance Bank',
    'ESAF Small Finance Bank',
    'Suryoday Small Finance Bank',
    'Utkarsh Small Finance Bank',
    'North East Small Finance Bank',

    // Payments Banks
    'Airtel Payments Bank',
    'India Post Payments Bank',
    'Paytm Payments Bank',
    'Fino Payments Bank',

    // Foreign Banks
    'HSBC Bank',
    'Citibank',
    'Standard Chartered Bank'
  ];

  filteredBanks = [...this.banks];

  // ---------------- FORM DATA ----------------
  holderName = '';
  accountNumber = '';
  ifsc = '';

  constructor() { }

  filterBanks(): void {
    const value = this.bankSearch.toLowerCase();
    this.filteredBanks = this.banks.filter(bank =>
      bank.toLowerCase().includes(value)
    );
  }

  selectBank(bank: string): void {
    this.selectedBank = bank;
    this.bankSearch = bank;
    this.showBankList = false;
  }

  // ---------------- ACTIONS ----------------
  close(): void {
    this.showBankList = false;
    this.closeEvent.emit();
  }

  submit(): void {
    const payload = {
      bank: this.selectedBank || this.bankSearch,
      holderName: this.holderName,
      accountNumber: this.accountNumber,
      ifsc: this.ifsc
    };

    console.log('Bank details submitted:', payload);
    this.submissionSuccess.emit();
    this.close();
  }
}
