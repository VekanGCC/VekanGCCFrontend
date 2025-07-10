import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ApplicationHistoryEntry {
  _id: string;
  application: string;
  previousStatus?: string;
  status: string;
  notes?: string;
  decisionReason?: {
    category?: string;
    details?: string;
    rating?: number;
    criteria?: string[];
    notes?: string;
  };
  notifyCandidate?: boolean;
  notifyClient?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  updatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface ApplicationDetails {
  _id: string;
  status: string;
  requirement?: {
    _id: string;
    title: string;
    status: string;
    priority: string;
  };
  resource?: {
    _id: string;
    name: string;
    status: string;
    category: string;
  };
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-application-history-modal',
  templateUrl: './application-history-modal.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      max-width: 800px;
      width: 95%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px 16px 0 0;
    }

    .header-content {
      flex: 1;
      margin-right: 16px;
    }

    .modal-title {
      margin: 0 0 16px 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-title::before {
      content: "📋";
      font-size: 1.25rem;
    }

    .application-details {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }

    .detail-row {
      display: flex;
      gap: 32px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 200px;
    }

    .detail-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-value {
      font-size: 0.875rem;
      color: white;
      font-weight: 600;
    }

    .close-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      color: white;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .modal-body {
      padding: 24px;
      background: #fafbfc;
    }

    .modal-footer {
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: white;
      border-radius: 0 0 16px 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      color: #6b7280;
      font-size: 1rem;
      font-weight: 500;
    }

    .no-data-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .no-data-icon {
      color: #9ca3af;
      margin-bottom: 20px;
      font-size: 3rem;
    }

    .no-data-title {
      margin: 0 0 12px 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
    }

    .no-data-message {
      margin: 0;
      color: #6b7280;
      font-size: 1rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .history-item {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .history-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .history-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .history-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .status-change-indicator {
      display: flex;
      align-items: center;
      color: #6b7280;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .history-date {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .history-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .history-section {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e5e7eb;
    }

    .section-title {
      margin: 0 0 12px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title::before {
      content: "📝";
      font-size: 0.875rem;
    }

    .history-field {
      margin-bottom: 12px;
    }

    .history-field:last-child {
      margin-bottom: 0;
    }

    .field-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 0.875rem;
      color: #111827;
      font-weight: 500;
      line-height: 1.5;
      margin: 0;
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star-filled {
      color: #fbbf24;
      font-size: 1rem;
    }

    .star-empty {
      color: #d1d5db;
      font-size: 1rem;
    }

    .rating-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .criteria-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .criteria-tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .notification-status {
      display: flex;
      gap: 16px;
    }

    .notification-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .notification-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
    }

    .notification-sent {
      color: #059669;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .notification-not-sent {
      color: #dc2626;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .follow-up-required {
      color: #dc2626;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .follow-up-not-required {
      color: #059669;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: white;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .debug-info {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: normal;
    }

    /* Status-specific colors */
    .status-applied { background: #dbeafe; color: #1e40af; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-shortlisted { background: #dbeafe; color: #1e40af; }
    .status-interview { background: #e9d5ff; color: #7c3aed; }
    .status-accepted { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
    .status-offer_created { background: #e0e7ff; color: #3730a3; }
    .status-onboarded { background: #ccfbf1; color: #0f766e; }
    .status-did_not_join { background: #fed7aa; color: #ea580c; }
    .status-withdrawn { background: #f3f4f6; color: #374151; }
    .status-unknown { background: #f3f4f6; color: #6b7280; }

    /* Responsive design */
    @media (max-width: 768px) {
      .modal-content {
        width: 98%;
        max-height: 90vh;
        border-radius: 12px;
      }
      
      .modal-header {
        padding: 20px 20px 16px 20px;
        border-radius: 12px 12px 0 0;
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .modal-footer {
        padding: 16px 20px;
        border-radius: 0 0 12px 12px;
      }
      
      .detail-row {
        flex-direction: column;
        gap: 12px;
      }
      
      .detail-item {
        min-width: auto;
      }
      
      .history-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .notification-status {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class ApplicationHistoryModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() applicationId: string = '';
  @Input() isVisible: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() history: ApplicationHistoryEntry[] = [];
  @Input() applicationDetails?: ApplicationDetails;
  @Output() close = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('🔧 ApplicationHistoryModal: ngOnInit called');
    console.log('🔧 ApplicationHistoryModal: Initial state:', {
      applicationId: this.applicationId,
      isVisible: this.isVisible,
      isLoading: this.isLoading,
      history: this.history
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔧 ApplicationHistoryModal: ngOnChanges called with changes:', changes);
    
    // Force change detection for all input changes
    if (changes['isLoading'] || changes['history'] || changes['applicationId'] || changes['isVisible']) {
      console.log('🔧 ApplicationHistoryModal: Current state after changes:', {
        applicationId: this.applicationId,
        isVisible: this.isVisible,
        isLoading: this.isLoading,
        history: this.history,
        historyLength: this.history?.length
      });
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  handleBackdropClick(event: MouseEvent): void {
    console.log('🔧 ApplicationHistoryModal: Backdrop clicked');
    if (event.target === event.currentTarget) {
      console.log('🔧 ApplicationHistoryModal: Emitting close event from backdrop click');
      this.closeModal();
    }
  }

  onClose(): void {
    console.log('🔧 ApplicationHistoryModal: onClose called, isLoading =', this.isLoading);
    if (!this.isLoading) {
      console.log('🔧 ApplicationHistoryModal: Emitting close event from onClose');
      this.closeModal();
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
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

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  formatDecisionCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'technical_skills': 'Technical Skills',
      'experience': 'Experience',
      'rate': 'Rate',
      'availability': 'Availability',
      'cultural_fit': 'Cultural Fit',
      'timeline': 'Timeline',
      'better_opportunity': 'Better Opportunity',
      'resource_unavailable': 'Resource Unavailable',
      'other': 'Other'
    };
    return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDecisionCriteria(criterion: string): string {
    const criteriaMap: { [key: string]: string } = {
      'technical_skills': 'Technical Skills',
      'experience_level': 'Experience Level',
      'rate_alignment': 'Rate Alignment',
      'availability': 'Availability',
      'cultural_fit': 'Cultural Fit',
      'communication': 'Communication',
      'portfolio': 'Portfolio',
      'references': 'References',
      'certifications': 'Certifications',
      'other': 'Other'
    };
    return criteriaMap[criterion] || criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  trackByHistoryItem(index: number, item: any): any {
    return item._id || index;
  }

  closeModal(): void {
    console.log('🔧 ApplicationHistoryModal: closeModal called');
    // Only emit close if modal is currently visible
    if (this.isVisible) {
      console.log('🔧 ApplicationHistoryModal: Emitting close event');
      this.close.emit();
      this.cdr.detectChanges();
    } else {
      console.log('🔧 ApplicationHistoryModal: Modal not visible, not emitting close');
    }
  }

  // Helper method to check if modal should show content
  shouldShowContent(): boolean {
    const result = this.isVisible && !this.isLoading;
    console.log('🔧 ApplicationHistoryModal: shouldShowContent =', result, {
      isVisible: this.isVisible,
      isLoading: this.isLoading
    });
    return result;
  }

  // Helper method to check if we have history data
  hasHistoryData(): boolean {
    const result = this.history && this.history.length > 0;
    console.log('🔧 ApplicationHistoryModal: hasHistoryData =', result, {
      history: this.history,
      historyLength: this.history?.length
    });
    return result;
  }

  // Debug method to log current state
  logCurrentState(): void {
    console.log('🔧 ApplicationHistoryModal: Current state:', {
      applicationId: this.applicationId,
      isVisible: this.isVisible,
      isLoading: this.isLoading,
      history: this.history,
      historyLength: this.history?.length,
      applicationDetails: this.applicationDetails
    });
  }
} 