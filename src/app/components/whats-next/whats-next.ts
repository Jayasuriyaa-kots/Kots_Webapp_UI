import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';

@Component({
  selector: 'app-whats-next',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whats-next.html',
  styleUrls: ['./whats-next.css']
})
export class WhatsNextComponent implements OnInit {

  userId: string = '';

  constructor(
    private router: Router,
    private location: Location,
    private bookingService: BookingService
  ) { }

  ngOnInit() {
    const booking = this.bookingService.getSelectedBookingValue();
    if (booking) {
      this.userId = booking.id;
    }
  }

  goBack() {
    this.location.back();
  }

  openNotifications() {
    this.router.navigate(['/notifications']);
  }
}
