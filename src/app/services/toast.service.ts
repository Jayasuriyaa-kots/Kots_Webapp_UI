import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

export interface ToastData {
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
    icon?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastSubject = new BehaviorSubject<ToastData | null>(null);
    public toast$ = this.toastSubject.asObservable();
    private hideTimeout: any;

    show(data: ToastData) {
        // Clear previous state and timeout
        this.hide();
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // Delay to ensure UI reacts to null then new data
        // This forces Angular to destroy then re-create the @if block
        setTimeout(() => {
            console.log('ToastService: Emitting new toast:', data.message);
            this.toastSubject.next(data);

            // Set autohide timeout
            this.hideTimeout = setTimeout(() => {
                this.hide();
            }, 5000);
        }, 50);
    }

    hide() {
        this.toastSubject.next(null);
    }
}
