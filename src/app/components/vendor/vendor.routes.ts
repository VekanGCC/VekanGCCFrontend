import { Routes } from '@angular/router';

export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../vendor-dashboard/vendor-dashboard.component').then(m => m.VendorDashboardComponent)
  },
  {
    path: 'requirements/:id',
    loadComponent: () => import('../vendor-dashboard/requirement-details/requirement-details.component').then(m => m.RequirementDetailsComponent)
  },
  {
    path: 'finance/sow-approval',
    loadComponent: () => import('../vendor-dashboard/sow-approvals/sow-approvals.component').then(m => m.SOWApprovalsComponent)
  },
  {
    path: 'finance/po-acceptance',
    loadComponent: () => import('../vendor-dashboard/po-approvals/po-approvals.component').then(m => m.POApprovalsComponent)
  },
  {
    path: 'finance/invoices',
    loadComponent: () => import('../vendor-dashboard/invoice-management/invoice-management.component').then(m => m.InvoiceManagementComponent)
  }
]; 