import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.html',
    styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
    phoneNumber: string = '';
    errorMessage: string = '';

    constructor(
        private router: Router,
        private themeService: ThemeService
    ) { }

    ngOnInit(): void {
        // Set the page background to match this component's theme
        this.themeService.setDarkGreyTheme();
    }

    requestOtp() {
        // Validate phone number
        if (this.phoneNumber.length < 10) {
            this.errorMessage = 'OOPS! The number entered isn\'t recognized. Please enter your registered mobile number associated with KOTS world!';
            return;
        }

        // Navigate to OTP component with phone number
        this.router.navigate(['/otp'], {
            state: { phoneNumber: this.phoneNumber }
        });
    }
}
