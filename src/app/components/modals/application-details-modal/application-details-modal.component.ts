import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application } from '../../../models/application.model';

@Component({
  selector: 'app-application-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Application Details</h2>
          <button 
            (click)="close()"
            class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6" *ngIf="application">
          <!-- Application ID -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500">Application ID</span>
            <span class="text-sm text-gray-900">#{{application._id.slice(-6)}}</span>
          </div>

          <!-- Status -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500">Status</span>
            <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getStatusClass(application.status)">
              {{formatStatus(application.status)}}
            </span>
          </div>

          <!-- Applied Date -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500">Applied Date</span>
            <span class="text-sm text-gray-900">{{application.createdAt | date:'medium'}}</span>
          </div>

          <!-- Resource Information -->
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Resource Information</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Resource ID</span>
                <span class="text-sm text-gray-900">#{{application.resourceId?.slice(-6) || 'N/A'}}</span>
              </div>
            </div>
          </div>

          <!-- Requirement Information -->
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Requirement Information</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Requirement ID</span>
                <span class="text-sm text-gray-900">#{{application.requirementId?.slice(-6) || 'N/A'}}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="border-t border-gray-200 pt-4" *ngIf="application.notes">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Notes</h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-700">{{application.notes}}</p>
            </div>
          </div>

          <!-- Additional Details -->
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Additional Details</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Last Updated</span>
                <span class="text-sm text-gray-900">{{application.updatedAt | date:'medium'}}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">Client ID</span>
                <span class="text-sm text-gray-900">#{{application.clientId?.slice(-6) || 'N/A'}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button 
            (click)="close()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ApplicationDetailsModalComponent {
  @Input() application: Application | null = null;
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'applied': 'bg-gray-100 text-gray-800',
      'shortlisted': 'bg-blue-100 text-blue-800',
      'interview': 'bg-purple-100 text-purple-800',
      'rejected': 'bg-red-100 text-red-800',
      'accepted': 'bg-green-100 text-green-800',
      'offer_created': 'bg-indigo-100 text-indigo-800',
      'onboarded': 'bg-teal-100 text-teal-800',
      'did_not_join': 'bg-orange-100 text-orange-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  formatStatus(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'applied': 'Applied',
      'shortlisted': 'Shortlisted',
      'interview': 'Interview',
      'rejected': 'Rejected',
      'accepted': 'Accepted',
      'offer_created': 'Offer Created',
      'onboarded': 'Onboarded',
      'did_not_join': 'Did Not Join'
    };
    return statusLabels[status] || status;
  }
} 