import { Component, signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { WebsocketService } from './services/websocket.service';
import { ToastService } from './services/toast.service';
import { ToastComponent } from './components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App implements OnInit {
  protected readonly title = signal('kots-pwa');

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private wsService: WebsocketService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // Scroll to top on every navigation
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        // Use setTimeout to ensure scroll happens after component renders
        setTimeout(() => {
          // Scroll window to top
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

          // Also scroll document body and html
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;

          // Scroll any scrollable container to top
          const containers = document.querySelectorAll('.container, .home-container, .ticket-history-page, .payment-history-container, [class$="-page"], [class$="-container"]');
          containers.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.scrollTop = 0;
            }
          });
        }, 0);
      });

      // Listen for real-time notifications
      this.wsService.notifications$.subscribe((data: any) => {
        console.log('AppComponent: Received WebSocket notification:', data);
        if (data.type === 'NOTIFICATION_RECEIVED') {
          console.log('AppComponent: Showing toast for:', data.notification.message);
          this.toastService.show({
            title: data.notification.notification_type || 'New Notification',
            message: data.notification.message,
            type: 'info',
            icon: data.notification.icon
          });
        }
      });
    }
  }
}
