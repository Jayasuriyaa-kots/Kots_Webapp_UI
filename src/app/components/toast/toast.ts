import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastData } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (currentToast) {
      <div class="toast-overlay" (click)="close()">
        <div class="toast-card" [class]="currentToast.type || 'info'" (click)="$event.stopPropagation()">
          <div class="toast-icon">
            @if (currentToast.type === 'success') {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            } @else {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            }
          </div>
          <div class="toast-content">
            <h4 class="toast-title">{{ currentToast.title }}</h4>
            <p class="toast-message">{{ currentToast.message }}</p>
          </div>
          <button class="toast-close" (click)="close()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast-overlay {
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      z-index: 10001;
      display: flex;
      justify-content: center;
      pointer-events: none;
    }
    .toast-card {
      pointer-events: auto;
      background: #ffffff;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      border-left: 5px solid #AFA11E;
      max-width: 450px;
      width: 100%;
      animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .toast-card.success { border-left-color: #22c55e; }
    .toast-card.error { border-left-color: #ef4444; }
    
    .toast-icon { padding-top: 2px; color: #AFA11E; }
    .success .toast-icon { color: #22c55e; }
    .error .toast-icon { color: #ef4444; }

    .toast-content { flex: 1; }
    .toast-title { margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #000; }
    .toast-message { margin: 0; font-size: 14px; color: #444; line-height: 1.4; font-weight: 500; }
    
    .toast-close {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toast-close:hover { background: #f3f4f6; color: #666; }

    @keyframes slideDown {
      from { transform: translateY(-120%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit {
  currentToast: ToastData | null = null;

  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.toastService.toast$.subscribe(toast => {
      console.log('ToastComponent: Received update:', toast);
      this.currentToast = toast;
      this.cdr.detectChanges(); // Force UI update
    });
  }

  close() {
    this.toastService.hide();
  }
}
