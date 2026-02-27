import { Routes } from '@angular/router';
import { OnboardingComponent } from './components/onboarding/onboarding';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';
import { NotificationsComponent } from './components/notifications/notifications';
import { TicketHistoryComponent } from './components/ticket-history/ticket-history';
import { RaiseTicketComponent } from './components/raise-ticket/raise-ticket';
import { TicketSuccessComponent } from './components/ticket-success/ticket-success';
import { PaymentHistoryComponent } from './components/payment-history/payment-history';
import { RentalPaymentComponent } from './components/rental-payment/rental-payment';
import { PaymentCheckoutComponent } from './components/payment-checkout/payment-checkout';
import { PaymentSuccessComponent } from './components/payment-success/payment-success';
import { CarParkingComponent } from './components/car-parking/car-parking';
import { CarParkingSuccessComponent } from './components/car-parking-success/car-parking-success';
import { CarParkingWaitingComponent } from './components/car-parking-waiting/car-parking-waiting';
import { CarParkingQueueSuccessComponent } from './components/car-parking-queue-success/car-parking-queue-success';
import { ContractComponent } from './components/contract/contract';
import { NoticeComponent } from './components/notice/notice';
import { NoticeSuccessComponent } from './components/notice-success/notice-success';

export const routes: Routes = [
  { path: '', redirectTo: '/onboarding', pathMatch: 'full' },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'otp', loadComponent: () => import('./components/otp/otp').then(m => m.OtpComponent) },
  { path: 'select-booking', loadComponent: () => import('./components/select-booking/select-booking').then(m => m.SelectBookingComponent) },
  { path: 'home', component: HomeComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'tickets', component: TicketHistoryComponent },
  { path: 'raise-ticket', component: RaiseTicketComponent },
  { path: 'ticket-success', component: TicketSuccessComponent },
  { path: 'payments', component: PaymentHistoryComponent },
  { path: 'pay-rent', component: RentalPaymentComponent },
  { path: 'payment-checkout', component: PaymentCheckoutComponent },
  { path: 'payment-success', component: PaymentSuccessComponent },
  { path: 'parking', component: CarParkingComponent },
  { path: 'car-parking-success', component: CarParkingSuccessComponent },
  { path: 'parking-waiting', component: CarParkingWaitingComponent },
  { path: 'parking-queue-success', component: CarParkingQueueSuccessComponent },
  { path: 'contract', component: ContractComponent },
  { path: 'notice', component: NoticeComponent },
  { path: 'notice-success', component: NoticeSuccessComponent },
  { path: 'move-out-success', loadComponent: () => import('./components/move-out-success/move-out-success').then(m => m.MoveOutSuccessComponent) },
  { path: 'move-out-final', loadComponent: () => import('./components/move-out-final/move-out-final').then(m => m.MoveOutFinalComponent) },
  { path: 'whats-next', loadComponent: () => import('./components/whats-next/whats-next').then(m => m.WhatsNextComponent) },
  { path: 'announcements', loadComponent: () => import('./components/announcements/announcements').then(m => m.AnnouncementsComponent) },
  { path: 'whats-next-final', loadComponent: () => import('./components/whats-next-final/whats-next-final').then(m => m.WhatsNextFinalComponent) },
  { path: 'profile', loadComponent: () => import('./components/profile/profile').then(m => m.ProfileComponent) },
  { path: 'wifi', loadComponent: () => import('./components/wifi-credentials/wifi-credentials').then(m => m.WifiCredentialsComponent) },
  { path: 'splinty', loadComponent: () => import('./components/splinty-access/splinty-access').then(m => m.SplintyAccessComponent) },
  { path: 'contract-documents', loadComponent: () => import('./components/contract-documents/contract-documents').then(m => m.ContractDocumentsComponent) },
  { path: 'faq', loadComponent: () => import('./components/faq/faq').then(m => m.FAQComponent) },
  { path: 'refer', loadComponent: () => import('./components/referral/referral').then(m => m.ReferralComponent) },
  { path: 'services', loadComponent: () => import('./components/services/services').then(m => m.ServicesComponent) },
  { path: 'services/:id', loadComponent: () => import('./components/service-details/service-details').then(m => m.ServiceDetailsComponent) },
  { path: 'services/:id/book', loadComponent: () => import('./components/service-booking/service-booking').then(m => m.ServiceBookingComponent) },
];