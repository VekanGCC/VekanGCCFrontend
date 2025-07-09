import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="onCancel()">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" (click)="$event.stopPropagation()">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-4">{{title}}</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">{{message}}</p>
          </div>
          <div class="items-center px-4 py-3">
            <button
              (click)="onConfirm()"
              class="px-4 py-2 text-white text-base font-medium rounded-md w-24 mr-2 focus:outline-none focus:ring-2 {{confirmButtonClass}}">
              {{confirmText}}
            </button>
            <button
              (click)="onCancel()"
              class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300">
              {{cancelText}}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DeleteConfirmationModalComponent {
  @Input() title: string = 'Confirm Delete';
  @Input() message: string = 'Are you sure you want to delete this item? This action cannot be undone.';
  @Input() confirmText: string = 'Delete';
  @Input() cancelText: string = 'Cancel';
  @Input() confirmButtonClass: string = 'bg-red-500 hover:bg-red-600 focus:ring-red-300';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 