import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { VendorGuard } from './guards/vendor.guard';
import { ClientGuard } from './guards/client.guard';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
console.log('🔧 AppRoutes: Loading main app routes configuration');

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'vendor',
    loadComponent: () => import('./components/vendor-dashboard/vendor-dashboard.component')
      .then(m => m.VendorDashboardComponent),
    canActivate: [AuthGuard, VendorGuard],
    data: { preload: true },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { 
        path: 'overview', 
        loadComponent: () => import('./components/vendor-dashboard/vendor-overview/vendor-overview.component')
          .then(m => m.VendorOverviewComponent)
      },
      { 
        path: 'resources', 
        loadComponent: () => import('./components/vendor-dashboard/vendor-resources/vendor-resources.component')
          .then(m => m.VendorResourcesComponent)
      },
      { 
        path: 'requirements', 
        loadComponent: () => import('./components/vendor-dashboard/vendor-requirements/vendor-requirements.component')
          .then(m => m.VendorRequirementsComponent)
      },
      { 
        path: 'applications', 
        loadComponent: () => import('./components/vendor-dashboard/vendor-applications/vendor-applications.component')
          .then(m => m.VendorApplicationsComponent)
      },
      { 
        path: 'user-management', 
        loadComponent: () => import('./components/vendor-dashboard/vendor-user-management/vendor-user-management.component')
          .then(m => m.VendorUserManagementComponent)
      },
      { 
        path: 'skill-management', 
        loadComponent: () => import('./components/vendor-dashboard/vendor-skill-management/vendor-skill-management.component')
          .then(m => m.VendorSkillManagementComponent)
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./components/profile/profile-dashboard.component')
          .then(m => m.ProfileDashboardComponent)
      },
      { 
        path: 'invoice-management', 
        loadComponent: () => import('./components/vendor-dashboard/invoice-management/invoice-management.component')
          .then(m => m.InvoiceManagementComponent)
      },
      { 
        path: 'sow-approvals', 
        loadComponent: () => import('./components/vendor-dashboard/sow-approvals/sow-approvals.component')
          .then(m => m.SOWApprovalsComponent)
      },
      { 
        path: 'po-approvals', 
        loadComponent: () => import('./components/vendor-dashboard/po-approvals/po-approvals.component')
          .then(m => m.POApprovalsComponent)
      },
      { 
        path: 'sow-management', 
        loadComponent: () => import('./components/vendor-dashboard/sow-management/sow-management.component')
          .then(m => m.SOWManagementComponent)
      },
      { 
        path: 'po-management', 
        loadComponent: () => import('./components/vendor-dashboard/po-management/po-management.component')
          .then(m => m.POManagementComponent)
      },
      { 
        path: 'matching-requirements', 
        loadComponent: () => import('./components/vendor-dashboard/matching-requirements/matching-requirements.component')
          .then(m => m.MatchingRequirementsComponent)
      },
      // Move this back to children
      { 
        path: 'apply-requirement-page', 
        loadComponent: () => import('./components/vendor-dashboard/apply-requirement-page/apply-requirement-page.component')
          .then(m => m.ApplyRequirementPageComponent)
      },
      { 
        path: 'requirements/:id', 
        loadComponent: () => import('./components/vendor-dashboard/requirement-details/requirement-details.component')
          .then(m => m.RequirementDetailsComponent)
      },
    ]
  },
  {
    path: 'client',
    loadComponent: () => import('./components/client-dashboard/client-dashboard.component')
      .then(m => m.ClientDashboardComponent),
    canActivate: [AuthGuard, ClientGuard],
    data: { preload: true },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { 
        path: 'overview', 
        loadComponent: () => import('./components/client-dashboard/client-overview/client-overview.component')
          .then(m => m.ClientOverviewComponent)
      },
      { 
        path: 'requirements', 
        loadComponent: () => import('./components/client-dashboard/client-requirements/client-requirements.component')
          .then(m => m.ClientRequirementsComponent)
      },
      { 
        path: 'resources', 
        loadComponent: () => import('./components/client-dashboard/client-resources/client-resources.component')
          .then(m => m.ClientResourcesComponent)
      },
      { 
        path: 'applications', 
        loadComponent: () => import('./components/client-dashboard/client-applications/client-applications.component')
          .then(m => m.ClientApplicationsComponent)
      },
      { 
        path: 'user-management', 
        loadComponent: () => import('./components/client-dashboard/client-user-management/client-user-management.component')
          .then(m => m.ClientUserManagementComponent)
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./components/profile/profile-dashboard.component')
          .then(m => m.ProfileDashboardComponent)
      },
      { 
        path: 'apply-resources', 
        loadComponent: () => import('./components/client-dashboard/apply-resources-page/apply-resources-page.component')
          .then(m => m.ApplyResourcesPageComponent)
      },
      { 
        path: 'matching-resources', 
        loadComponent: () => import('./components/client-dashboard/matching-resources/matching-resources.component')
          .then(m => m.MatchingResourcesComponent)
      },
      { 
        path: 'sow-management', 
        loadComponent: () => import('./components/client-dashboard/sow-management/sow-management.component')
          .then(m => m.SOWManagementComponent)
      },
      { 
        path: 'po-management', 
        loadComponent: () => import('./components/client-dashboard/po-management/po-management.component')
          .then(m => m.POManagementComponent)
      },
      { 
        path: 'invoice-management', 
        loadComponent: () => import('./components/client-dashboard/invoice-management/invoice-management.component')
          .then(m => m.InvoiceManagementComponent)
      },
      { 
        path: 'resources/:id', 
        loadComponent: () => import('./components/client-dashboard/resource-details/resource-details.component')
          .then(m => m.ResourceDetailsComponent)
      },
      { 
        path: 'payment-management', 
        loadComponent: () => import('./components/client-dashboard/payment-management/payment-management.component')
          .then(m => m.PaymentManagementComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

console.log('🔧 AppRoutes: Main app routes configuration loaded:', routes);