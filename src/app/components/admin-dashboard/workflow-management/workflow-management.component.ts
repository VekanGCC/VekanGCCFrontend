import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowService } from '../../../services/workflow.service';
import { AuthService } from '../../../services/auth.service';
import {
  WorkflowConfiguration,
  WorkflowInstance,
  CreateWorkflowRequest,
  WorkflowFilters,
  WorkflowInstanceFilters,
  WorkflowStep,
  WorkflowSettings
} from '../../../models/workflow.model';
import { PaginationState } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';

@Component({
  selector: 'app-workflow-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './workflow-management.component.html',
  styleUrls: ['./workflow-management.component.scss']
})
export class WorkflowManagementComponent implements OnInit, OnDestroy {
  // Data
  workflows: WorkflowConfiguration[] = [];
  workflowInstances: WorkflowInstance[] = [];
  currentUser: any;
  isLoading = false;
  error: string | null = null;

  // Pagination
  workflowPagination: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  instancePagination: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  // UI State
  activeTab: 'configurations' | 'instances' = 'configurations';
  showCreateModal = false;
  showEditModal = false;
  showInstanceModal = false;
  selectedWorkflow: WorkflowConfiguration | null = null;
  selectedInstance: WorkflowInstance | null = null;

  // Forms
  workflowForm: FormGroup;
  filters: WorkflowFilters = {};
  
  // Step management
  workflowSteps: WorkflowStep[] = [];
  showStepModal = false;
  editingStepIndex: number | null = null;
  stepForm: FormGroup;

  // Application types for form
  applicationTypes = [
    { value: 'client_applied', label: 'Client Applied' },
    { value: 'vendor_applied', label: 'Vendor Applied' },
    { value: 'both', label: 'Both' }
  ];

  // Role options for steps
  roleOptions = [
    { value: 'client', label: 'Client' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'admin', label: 'Admin' },
    { value: 'hr_admin', label: 'HR Admin' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  // Action options for steps
  actionOptions = [
    { value: 'review', label: 'Review' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' },
    { value: 'notify', label: 'Notify' },
    { value: 'escalate', label: 'Escalate' },
    { value: 'interact', label: 'Interact' },
    { value: 'revoke', label: 'Revoke' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private workflowService: WorkflowService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.workflowForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      applicationTypes: [[], [Validators.required]],
      isDefault: [false],
      settings: this.formBuilder.group({
        allowParallelProcessing: [false],
        maxProcessingTime: [72, [Validators.min(1), Validators.max(720)]],
        autoEscalateAfter: [24, [Validators.min(1), Validators.max(168)]],
        requireComments: [true]
      })
    });

    this.stepForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      order: [1, [Validators.required, Validators.min(1)]],
      role: ['', [Validators.required]],
      action: ['', [Validators.required]],
      required: [true],
      autoAdvance: [false],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('WorkflowManagement: Current user:', this.currentUser);
    console.log('WorkflowManagement: User role:', this.currentUser?.userType);
    console.log('WorkflowManagement: User organizationRole:', this.currentUser?.organizationRole);
    
    // Check if user has permission to access workflow management
    if (!this.canAccessWorkflowManagement()) {
      this.error = 'You do not have permission to access workflow management. Only admin owners can manage workflows.';
      console.log('WorkflowManagement: User does not have permission to access workflow management');
      return;
    }
    
    this.loadWorkflows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load workflows
  loadWorkflows(): void {
    this.isLoading = true;
    this.error = null;

    console.log('WorkflowManagement: Loading workflows...');
    console.log('WorkflowManagement: Current user role:', this.currentUser?.userType);

    this.workflowService.getWorkflowConfigurations(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('WorkflowManagement: Workflows loaded successfully:', response);
          this.workflows = response.data || [];
          this.workflowPagination = {
            currentPage: response.pagination?.page || 1,
            pageSize: response.pagination?.limit || 10,
            totalItems: response.pagination?.total || 0,
            totalPages: response.pagination?.totalPages || 0,
            isLoading: false,
            hasNextPage: (response.pagination?.page || 1) < (response.pagination?.totalPages || 0),
            hasPreviousPage: (response.pagination?.page || 1) > 1
          };
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('WorkflowManagement: Error loading workflows:', error);
          console.error('WorkflowManagement: Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.error = 'Failed to load workflows';
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  // Load workflow instances
  loadWorkflowInstances(): void {
    this.isLoading = true;
    this.error = null;

    const filters: WorkflowInstanceFilters = {
      page: this.instancePagination.currentPage,
      limit: this.instancePagination.pageSize
    };

    this.workflowService.getWorkflowInstances(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflowInstances = response.data || [];
          this.instancePagination = {
            currentPage: response.pagination?.page || 1,
            pageSize: response.pagination?.limit || 10,
            totalItems: response.pagination?.total || 0,
            totalPages: response.pagination?.totalPages || 0,
            isLoading: false,
            hasNextPage: (response.pagination?.page || 1) < (response.pagination?.totalPages || 0),
            hasPreviousPage: (response.pagination?.page || 1) > 1
          };
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error loading workflow instances:', error);
          this.error = 'Failed to load workflow instances';
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  // Tab switching
  switchTab(tab: 'configurations' | 'instances'): void {
    this.activeTab = tab;
    if (tab === 'instances') {
      this.loadWorkflowInstances();
    } else {
      this.loadWorkflows();
    }
  }

  // Create workflow
  onCreateWorkflow(): void {
    this.selectedWorkflow = null;
    this.workflowSteps = []; // Reset steps
    this.workflowForm.reset({
      name: '',
      description: '',
      applicationTypes: [],
      isDefault: false,
      settings: {
        allowParallelProcessing: false,
        maxProcessingTime: 72,
        autoEscalateAfter: 24,
        requireComments: true
      }
    });
    this.showCreateModal = true;
  }

  // Edit workflow
  onEditWorkflow(workflow: WorkflowConfiguration): void {
    this.selectedWorkflow = workflow;
    this.workflowForm.patchValue({
      name: workflow.name,
      description: workflow.description,
      applicationTypes: workflow.applicationTypes,
      isDefault: workflow.isDefault,
      settings: workflow.settings
    });
    
    // Load existing steps
    this.workflowSteps = workflow.steps ? [...workflow.steps] : [];
    
    this.showEditModal = true;
  }

  // View workflow instance
  onViewInstance(instance: WorkflowInstance): void {
    this.selectedInstance = instance;
    this.showInstanceModal = true;
  }

  // Save workflow
  onSaveWorkflow(): void {
    if (this.workflowForm.valid && this.workflowSteps.length > 0) {
      const formValue = this.workflowForm.value;
      const workflowData: CreateWorkflowRequest = {
        name: formValue.name,
        description: formValue.description,
        applicationTypes: formValue.applicationTypes,
        isDefault: formValue.isDefault,
        steps: this.workflowSteps,
        settings: formValue.settings
      };

      if (this.selectedWorkflow) {
        // Update existing workflow
        this.workflowService.updateWorkflowConfiguration(this.selectedWorkflow._id, workflowData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.showEditModal = false;
              this.loadWorkflows();
            },
            error: (error) => {
              console.error('Error updating workflow:', error);
              this.error = 'Failed to update workflow';
            }
          });
      } else {
        // Create new workflow
        this.workflowService.createWorkflowConfiguration(workflowData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.showCreateModal = false;
              this.loadWorkflows();
            },
            error: (error) => {
              console.error('Error creating workflow:', error);
              this.error = 'Failed to create workflow';
            }
          });
      }
    } else if (this.workflowSteps.length === 0) {
      this.error = 'At least one workflow step is required';
    }
  }

  // Delete workflow
  onDeleteWorkflow(workflow: WorkflowConfiguration): void {
    if (confirm(`Are you sure you want to delete the workflow "${workflow.name}"?`)) {
      this.workflowService.deleteWorkflowConfiguration(workflow._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loadWorkflows();
          },
          error: (error) => {
            console.error('Error deleting workflow:', error);
            this.error = 'Failed to delete workflow';
          }
        });
    }
  }

  // Toggle workflow status
  onToggleWorkflowStatus(workflow: WorkflowConfiguration): void {
    const updatedWorkflow = {
      ...workflow,
      isActive: !workflow.isActive
    };

    this.workflowService.updateWorkflowConfiguration(workflow._id, updatedWorkflow)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadWorkflows();
        },
        error: (error) => {
          console.error('Error updating workflow status:', error);
          this.error = 'Failed to update workflow status';
        }
      });
  }

  // Pagination handlers
  onWorkflowPageChange(page: number): void {
    this.workflowPagination.currentPage = page;
    this.filters.page = page;
    this.loadWorkflows();
  }

  onInstancePageChange(page: number): void {
    this.instancePagination.currentPage = page;
    this.loadWorkflowInstances();
  }

  // Close modals
  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showInstanceModal = false;
    this.selectedWorkflow = null;
    this.selectedInstance = null;
    this.workflowForm.reset();
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getApplicationTypesDisplay(types: string[]): string {
    return types.map(type => {
      const option = this.applicationTypes.find(opt => opt.value === type);
      return option ? option.label : type;
    }).join(', ');
  }

  canEditWorkflow(): boolean {
    return this.currentUser?.organizationRole === 'admin_owner';
  }

  canDeleteWorkflow(workflow: WorkflowConfiguration): boolean {
    return this.currentUser?.organizationRole === 'admin_owner' && !workflow.isDefault;
  }

  onApplicationTypeChange(event: any, typeValue: string): void {
    const currentTypes = this.workflowForm.get('applicationTypes')?.value || [];
    if (event.target.checked) {
      if (!currentTypes.includes(typeValue)) {
        this.workflowForm.get('applicationTypes')?.setValue([...currentTypes, typeValue]);
      }
    } else {
      this.workflowForm.get('applicationTypes')?.setValue(currentTypes.filter((t: string) => t !== typeValue));
    }
  }

  canAccessWorkflowManagement(): boolean {
    if (!this.currentUser) return false;
    
    // Check organization role first (new system)
    if (this.currentUser.organizationRole === 'admin_owner') {
      return true;
    }
    
    // Check legacy role field
    if (this.currentUser.organizationRole === 'admin_owner') {
      return true;
    }
    
    return false;
  }

  // Step management methods
  onAddStep(): void {
    this.editingStepIndex = null;
    this.stepForm.reset({
      name: '',
      order: this.workflowSteps.length + 1,
      role: '',
      action: '',
      required: true,
      autoAdvance: false,
      description: ''
    });
    this.showStepModal = true;
  }

  onEditStep(index: number): void {
    const step = this.workflowSteps[index];
    this.editingStepIndex = index;
    this.stepForm.patchValue({
      name: step.name,
      order: step.order,
      role: step.role,
      action: step.action,
      required: step.required,
      autoAdvance: step.autoAdvance,
      description: step.description
    });
    this.showStepModal = true;
  }

  onDeleteStep(index: number): void {
    this.workflowSteps.splice(index, 1);
    // Reorder remaining steps
    this.workflowSteps.forEach((step, i) => {
      step.order = i + 1;
    });
  }

  onSaveStep(): void {
    if (this.stepForm.valid) {
      const stepData = this.stepForm.value;
      
      if (this.editingStepIndex !== null) {
        // Update existing step
        this.workflowSteps[this.editingStepIndex] = stepData;
      } else {
        // Add new step
        this.workflowSteps.push(stepData);
      }

      // Sort steps by order
      this.workflowSteps.sort((a, b) => a.order - b.order);
      
      this.showStepModal = false;
      this.editingStepIndex = null;
    }
  }

  onCloseStepModal(): void {
    this.showStepModal = false;
    this.editingStepIndex = null;
  }


} 