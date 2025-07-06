import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Application } from '../../../models/application.model';

export interface ApplicationActionData {
  applicationId: string;
  status: string;
  decisionReason?: {
    category: string;
    details?: string;
    rating?: number;
    criteria: string[];
    notes?: string;
  };
  notifyCandidate?: boolean;
  notifyClient?: boolean;
  followUpRequired?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
}

@Component({
  selector: 'app-application-action-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './application-action-modal.component.html',
  styleUrls: ['./application-action-modal.component.scss']
})
export class ApplicationActionModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() application: Application | null = null;
  @Input() actionType: 'revoke' | 'accept_offer' | 'reject_offer' = 'revoke';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<ApplicationActionData>();

  actionForm: FormGroup;
  isLoading = false;

  // Decision categories based on action type
  get decisionCategories() {
    console.log('🔧 ApplicationActionModal: Getting decision categories for actionType:', this.actionType);
    switch (this.actionType) {
      case 'revoke':
        return [
          { value: 'resource_unavailable', label: 'Resource No Longer Available' },
          { value: 'rate_negotiation_failed', label: 'Rate Negotiation Failed' },
          { value: 'timeline', label: 'Timeline Conflict' },
          { value: 'better_opportunity', label: 'Better Opportunity Found' },
          { value: 'other', label: 'Other' }
        ];
      case 'accept_offer':
        return [
          { value: 'rate_acceptable', label: 'Rate is Acceptable' },
          { value: 'availability_matches', label: 'Availability Matches Requirement' },
          { value: 'location_acceptable', label: 'Location is Acceptable' },
          { value: 'joining_date_ok', label: 'Joining Date is Acceptable' },
          { value: 'project_scope_good', label: 'Project Scope is Good' },
          { value: 'client_reputation', label: 'Client Reputation is Good' },
          { value: 'other', label: 'Other' }
        ];
      case 'reject_offer':
        return [
          { value: 'rate_too_low', label: 'Rate is Too Low' },
          { value: 'availability_conflict', label: 'Availability Conflict' },
          { value: 'location_issue', label: 'Location Issue' },
          { value: 'joining_date_conflict', label: 'Joining Date Conflict' },
          { value: 'project_scope_issue', label: 'Project Scope Issue' },
          { value: 'client_reputation_concern', label: 'Client Reputation Concern' },
          { value: 'better_opportunity', label: 'Better Opportunity Available' },
          { value: 'other', label: 'Other' }
        ];
      default:
        return [];
    }
  }

  // Criteria options based on action type
  get criteriaOptions() {
    switch (this.actionType) {
      case 'accept_offer':
      case 'reject_offer':
        return [
          { value: 'rate_evaluation', label: 'Rate Evaluation' },
          { value: 'availability_check', label: 'Availability Check' },
          { value: 'location_assessment', label: 'Location Assessment' },
          { value: 'joining_date_review', label: 'Joining Date Review' },
          { value: 'project_scope_analysis', label: 'Project Scope Analysis' },
          { value: 'client_reputation_check', label: 'Client Reputation Check' },
          { value: 'contract_terms_review', label: 'Contract Terms Review' },
          { value: 'resource_availability', label: 'Resource Availability' },
          { value: 'financial_viability', label: 'Financial Viability' }
        ];
      default:
        return [];
    }
  }

  constructor(private fb: FormBuilder, private changeDetectorRef: ChangeDetectorRef) {
    this.actionForm = this.fb.group({
      decisionReason: this.fb.group({
        category: ['', Validators.required],
        details: [''],
        rating: [null, [Validators.min(1), Validators.max(5)]],
        criteria: [[]],
        notes: ['']
      }),
      notifyCandidate: [false],
      notifyClient: [false],
      followUpRequired: [false],
      followUpDate: [null],
      followUpNotes: ['']
    });

    this.actionForm.get('followUpRequired')?.valueChanges.subscribe(required => {
      const followUpDateControl = this.actionForm.get('followUpDate');
      if (required) {
        followUpDateControl?.setValidators([Validators.required]);
      } else {
        followUpDateControl?.clearValidators();
      }
      followUpDateControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    // No need to initialize form here since it's done in constructor
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔧 ApplicationActionModal: ngOnChanges called', changes);
    
    if (changes['actionType'] || changes['isVisible']) {
      console.log('🔧 ApplicationActionModal: Action type or visibility changed, resetting form');
      this.resetForm();
      this.changeDetectorRef.detectChanges();
    }
  }

  resetForm(): void {
    console.log('🔧 ApplicationActionModal: Resetting form for actionType:', this.actionType);
    
    this.actionForm.reset({
      decisionReason: {
        category: '',
        details: '',
        rating: null,
        criteria: [],
        notes: ''
      },
      notifyCandidate: false,
      notifyClient: false,
      followUpRequired: false,
      followUpDate: null,
      followUpNotes: ''
    });

    this.actionForm.get('followUpDate')?.clearValidators();
    this.actionForm.updateValueAndValidity();
    this.changeDetectorRef.detectChanges();
  }

  getModalTitle(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'Revoke Application';
      case 'accept_offer':
        return 'Accept Client Offer';
      case 'reject_offer':
        return 'Reject Client Offer';
      default:
        return 'Application Action';
    }
  }

  getModalDescription(): string {
    if (!this.application) return '';
    
    const resourceName = typeof this.application.resource === 'string' 
      ? 'Unknown Resource' 
      : this.application.resource?.name || 'Unknown Resource';
    
    const requirementTitle = typeof this.application.requirement === 'string'
      ? 'Unknown Requirement'
      : this.application.requirement?.title || 'Unknown Requirement';
    
    switch (this.actionType) {
      case 'revoke':
        return `Withdraw ${resourceName} from ${requirementTitle}`;
      case 'accept_offer':
        return `Accept the client's offer for ${resourceName} on ${requirementTitle}`;
      case 'reject_offer':
        return `Reject the client's offer for ${resourceName} on ${requirementTitle}`;
      default:
        return `${resourceName} - ${requirementTitle}`;
    }
  }

  getActionTypeLabel(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'Revoke';
      case 'accept_offer':
        return 'Accept';
      case 'reject_offer':
        return 'Reject';
      default:
        return 'Action';
    }
  }

  getResourceName(application: Application): string {
    if (typeof application.resource === 'string') {
      return 'Unknown Resource';
    }
    return application.resource?.name || 'Unknown Resource';
  }

  getRequirementTitle(application: Application): string {
    if (typeof application.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return application.requirement?.title || 'Unknown Requirement';
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

  getModalSubtitle(): string {
    if (!this.application) return '';
    
    const resourceName = typeof this.application.resource === 'string' 
      ? 'Unknown Resource' 
      : this.application.resource?.name || 'Unknown Resource';
    
    const requirementTitle = typeof this.application.requirement === 'string'
      ? 'Unknown Requirement'
      : this.application.requirement?.title || 'Unknown Requirement';
    
    switch (this.actionType) {
      case 'revoke':
        return `Withdraw ${resourceName} from ${requirementTitle}`;
      case 'accept_offer':
        return `Accept offer for ${resourceName} on ${requirementTitle}`;
      case 'reject_offer':
        return `Reject offer for ${resourceName} on ${requirementTitle}`;
      default:
        return `${resourceName} - ${requirementTitle}`;
    }
  }

  getModalIcon(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'M6 18L18 6M6 6l12 12'; // X icon
      case 'accept_offer':
        return 'M5 13l4 4L19 7'; // Check icon
      case 'reject_offer':
        return 'M6 18L18 6M6 6l12 12'; // X icon
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info icon
    }
  }

  getModalIconColor(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'text-red-600';
      case 'accept_offer':
        return 'text-green-600';
      case 'reject_offer':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  }

  getModalIconBg(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'bg-red-100';
      case 'accept_offer':
        return 'bg-green-100';
      case 'reject_offer':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  }

  getSubmitButtonText(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'Revoke Application';
      case 'accept_offer':
        return 'Accept Client Offer';
      case 'reject_offer':
        return 'Reject Client Offer';
      default:
        return 'Submit';
    }
  }

  getSubmitButtonColor(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'accept_offer':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'reject_offer':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  toggleCriteria(criteria: string, event: any): void {
    const currentCriteria = this.actionForm.get('decisionReason.criteria')?.value || [];
    if (event.target.checked) {
      if (!currentCriteria.includes(criteria)) {
        currentCriteria.push(criteria);
      }
    } else {
      const index = currentCriteria.indexOf(criteria);
      if (index > -1) {
        currentCriteria.splice(index, 1);
      }
    }
    this.actionForm.get('decisionReason.criteria')?.setValue(currentCriteria);
  }

  onSubmit(): void {
    if (this.actionForm.valid && this.application) {
      this.isLoading = true;
      
      const formValue = this.actionForm.value;
      const actionData: ApplicationActionData = {
        applicationId: this.application._id,
        status: this.getStatusFromActionType(),
        decisionReason: {
          category: formValue.decisionReason.category,
          details: formValue.decisionReason.details,
          rating: formValue.decisionReason.rating,
          criteria: formValue.decisionReason.criteria,
          notes: formValue.decisionReason.notes
        },
        notifyCandidate: formValue.notifyCandidate,
        notifyClient: formValue.notifyClient,
        followUpRequired: formValue.followUpRequired,
        followUpDate: formValue.followUpDate,
        followUpNotes: formValue.followUpNotes
      };

      this.confirm.emit(actionData);
      this.isLoading = false;
    } else {
      console.log('🔧 ApplicationActionModal: Form invalid, cannot submit', {
        formValid: this.actionForm.valid,
        errors: this.actionForm.errors,
        decisionReasonErrors: this.actionForm.get('decisionReason')?.errors,
        categoryErrors: this.actionForm.get('decisionReason.category')?.errors,
        followUpDateErrors: this.actionForm.get('followUpDate')?.errors
      });
    }
  }

  private getStatusFromActionType(): string {
    switch (this.actionType) {
      case 'revoke':
        return 'withdrawn';
      case 'accept_offer':
        return 'offer_accepted';
      case 'reject_offer':
        return 'rejected';
      default:
        return 'applied';
    }
  }

  isCriteriaSelected(criteria: string): boolean {
    const currentCriteria = this.actionForm.get('decisionReason.criteria')?.value || [];
    return currentCriteria.includes(criteria);
  }

  get isFormReady(): boolean {
    return !!this.actionForm && 
           !!this.actionForm.get('decisionReason') && 
           !!this.actionForm.get('decisionReason.category');
  }

  get isFormValid(): boolean {
    if (!this.actionForm) return false;
    
    const decisionReason = this.actionForm.get('decisionReason');
    if (!decisionReason) return false;
    
    const category = decisionReason.get('category');
    if (!category || category.invalid) return false;
    
    const followUpRequired = this.actionForm.get('followUpRequired');
    if (followUpRequired && followUpRequired.value) {
      const followUpDate = this.actionForm.get('followUpDate');
      if (!followUpDate || followUpDate.invalid) return false;
    }
    
    return true;
  }

  getDecisionCategories(): string[] {
    return this.decisionCategories.map(cat => cat.value);
  }

  getDecisionCriteria(): string[] {
    return this.criteriaOptions.map(crit => crit.value);
  }

  trackByCategory(index: number, category: any): string {
    return category.value;
  }
} 