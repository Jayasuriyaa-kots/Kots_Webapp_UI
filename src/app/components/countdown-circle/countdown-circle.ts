import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    Inject,
    PLATFORM_ID,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-countdown-circle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './countdown-circle.html',
    styleUrls: ['./countdown-circle.css']
})
export class CountdownCircleComponent implements OnInit, OnChanges, OnDestroy {

    @Input() targetDate!: Date | string;
    @Output() countdownComplete = new EventEmitter<void>();

    days = '00';
    minutes = '00';
    seconds = '00';

    readonly radius = 90;
    readonly circumference = 2 * Math.PI * this.radius;
    progressOffset = this.circumference;

    private totalDurationSeconds = 1;
    private destroyed = false;
    private date!: Date;
    private timerId: any = null;

    constructor(
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.initializeAndStart();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (changes['targetDate']) {
            this.initializeAndStart();
        }
    }

    private initializeAndStart(): void {
        if (!this.targetDate) return;

        const value = this.targetDate;
        this.date = value instanceof Date ? value : new Date(value);

        if (isNaN(this.date.getTime())) {
            console.error('Invalid targetDate:', value);
            return;
        }

        this.totalDurationSeconds = Math.max(
            1,
            Math.floor((this.date.getTime() - Date.now()) / 1000)
        );

        // Clear existing timer
        if (this.timerId) {
            clearInterval(this.timerId);
        }

        // Start ticking with setInterval
        this.updateCountdown();
        this.timerId = setInterval(() => {
            this.updateCountdown();
            this.cdr.detectChanges(); // Force Angular to update the view
        }, 1000);
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        if (this.timerId) {
            clearInterval(this.timerId);
        }
    }

    private updateCountdown(): void {
        if (!this.date) return;

        const diffMs = this.date.getTime() - Date.now();

        if (diffMs <= 0) {
            this.setZeroState();
            if (this.timerId) {
                clearInterval(this.timerId);
            }
            return;
        }

        const totalSeconds = Math.floor(diffMs / 1000);

        const days = Math.floor(totalSeconds / 86400);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        this.days = this.pad(days);
        this.minutes = this.pad(minutes);
        this.seconds = this.pad(seconds);

        this.progressOffset =
            this.circumference * (1 - totalSeconds / this.totalDurationSeconds);
    }

    private setZeroState(): void {
        this.days = this.minutes = this.seconds = '00';
        this.progressOffset = 0;
        this.countdownComplete.emit();
        this.cdr.detectChanges();
    }

    private pad(value: number): string {
        return value < 10 ? `0${value}` : `${value}`;
    }
}
