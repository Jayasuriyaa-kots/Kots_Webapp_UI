import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';
import { Subscription } from 'rxjs';

interface Announcement {
  title: string;
  date: string; // e.g., "15-May-2024 / 09:00 am"
  description: string;
  from: string;
  to: string;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcements.html',
  styleUrls: ['./announcements.css']
})
export class AnnouncementsComponent implements OnInit, OnDestroy {

  announcements: Announcement[] = [
    {
      title: 'Water Supply Interruption',
      date: '15-May-2024 / 09:00 am',
      description: 'Due to some electrical issues, there will be a power outage.',
      from: 'January 15, 2023',
      to: 'January 15, 2023 8.00 am'
    },
    {
      title: 'Scheduled Power Cut',
      date: '14-Jan-2024 / 09:00 am',
      description: 'Due to some electrical issues, there will be a power outage.',
      from: 'January 15, 2023 8.00 am',
      to: 'January 15, 2023 8.00 am'
    },
    {
      title: 'Property maintenance',
      date: '15-May-2024 / 09:00 am',
      description: 'Due to some electrical issues, there will be a power outage.',
      from: 'January 15, 2023',
      to: '' // Screenshot wraps or cuts off
    }
  ];

  userId = '';
  private bookingSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private location: Location,
    private bookingService: BookingService
  ) { }

  ngOnInit(): void {
    this.bookingSubscription = this.bookingService.getSelectedBooking().subscribe(booking => {
      if (booking) {
        this.userId = booking.id;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.bookingSubscription) {
      this.bookingSubscription.unsubscribe();
    }
  }

  goBack() {
    this.location.back();
  }

  openNotifications() {
    this.router.navigate(['/notifications']);
  }
}
