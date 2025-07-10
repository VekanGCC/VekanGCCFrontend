import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DeactivationConfirmationData {
  name: string;
  type: 'resource' | 'requirement';
  activeApplicationsCount: number;
}

@Component({
  selector: 'app-deactivation-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <img src="assets/icons/lucide/lucide/alert-triangle.svg" alt="warning" class="w-4 h-4 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Confirm Deactivation</h3>
          </div>
          <button
            (click)="onCancel()"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <img src="assets/icons/lucide/lucide/x.svg" alt="close" class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="mb-4">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <img src="assets/icons/lucide/lucide/alert-triangle.svg" alt="warning" class="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 class="text-sm font-medium text-yellow-800 mb-1">
                    Active Applications Found
                  </h4>
                  <p class="text-sm text-yellow-700">
                    <strong>"{{ data.name }}"</strong> has 
                    <strong>{{ data.activeApplicationsCount }}</strong> 
                    active {{ data.activeApplicationsCount === 1 ? 'application' : 'applications' }} 
                    {{ data.type === 'resource' ? 'for this resource' : 'for this requirement' }}.
                  </p>
                </div>
              </div>
            </div>
            
            <p class="text-sm text-gray-600">
              Deactivating this {{ data.type }} will affect the ongoing applications. 
              Are you sure you want to proceed?
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            (click)="onCancel()"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            (click)="onConfirm()"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Deactivate {{ data.type === 'resource' ? 'Resource' : 'Requirement' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DeactivationConfirmationModalComponent {
  @Input() data!: DeactivationConfirmationData;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 