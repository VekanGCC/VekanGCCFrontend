import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application } from '../../../models/application.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './applications-view.component.html',
  styleUrls: ['./applications-view.component.scss']
})
export class ApplicationsViewComponent {
  @Input() applications: Application[] = [];
  @Input() paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  @Output() pageChange = new EventEmitter<number>();
  @Output() statusUpdate = new EventEmitter<{applicationId: string, status: string, notes?: string}>();

  constructor() {}

  getApplicationTitle(application: any): string {
    if (this.isObject(application.resource)) {
      return application.resource.name || 'Resource';
    }
    if (this.isObject(application.requirement)) {
      return application.requirement.title || 'Requirement';
    }
    return 'Unknown';
  }

  getApplicationCreator(application: any): string {
    if (this.isObject(application.createdBy)) {
      const firstName = application.createdBy.firstName || '';
      const lastName = application.createdBy.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'User';
    }
    return 'User';
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'applied':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'offer_created':
        return 'bg-indigo-100 text-indigo-800';
      case 'offer_accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'onboarded':
        return 'bg-teal-100 text-teal-800';
      case 'did_not_join':
        return 'bg-orange-100 text-orange-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getAvailableActions(application: any): any[] {
    const status = application.status?.toLowerCase();
    const actions = [];

    // Admin can approve/reject applications in 'applied' status
    if (status === 'applied') {
      actions.push(
        { action: 'shortlisted', label: 'Approve & Shortlist', color: 'bg-green-100 text-green-800' },
        { action: 'rejected', label: 'Reject', color: 'bg-red-100 text-red-800' }
      );
    }

    // Admin can approve/reject offers in 'offer_created' status
    if (status === 'offer_created') {
      actions.push(
        { action: 'offer_accepted', label: 'Approve Offer', color: 'bg-green-100 text-green-800' },
        { action: 'rejected', label: 'Reject Offer', color: 'bg-red-100 text-red-800' }
      );
    }

    // Admin can revoke at any point
    if (['applied', 'shortlisted', 'interview', 'accepted', 'offer_created', 'offer_accepted'].includes(status)) {
      actions.push(
        { action: 'withdrawn', label: 'Revoke', color: 'bg-orange-100 text-orange-800' }
      );
    }

    return actions;
  }

  onActionClick(applicationId: string, action: string): void {
    this.statusUpdate.emit({
      applicationId,
      status: action,
      notes: `Admin action: ${action}`
    });
  }

  isObject(val: any): boolean {
    return val && typeof val === 'object';
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 