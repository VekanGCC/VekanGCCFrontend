import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { Category } from '../../../models/category.model';
import { ApiResponse } from '../../../models/api-response.model';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './categories-management.component.html',
  styles: [`
    .modal-backdrop {
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .pagination .page-link {
      cursor: pointer;
    }
    
    .pagination .page-item.disabled .page-link {
      cursor: not-allowed;
    }
  `]
})
export class CategoriesManagementComponent implements OnInit {
  @Input() categories: Category[] = [];
  @Input() isLoading = false;
  @Output() openAddModal = new EventEmitter<void>();
  @Output() openEditModal = new EventEmitter<Category>();
  @Output() categoryUpdated = new EventEmitter<Category>();
  @Output() categoryAdded = new EventEmitter<Category>();
  
  pagination: any = null;
  currentPage = 1;
  searchTerm = '';
  statusFilter = '';
  isSubmitting = false;
  
  categoryForm: FormGroup;
  Math = Math;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Categories are now passed as input from parent component
    console.log('Categories received:', this.categories);
  }

  onSearch(): void {
    // Implement search functionality if needed
    console.log('Search term:', this.searchTerm);
  }

  changePage(page: number): void {
    // Implement pagination if needed
    console.log('Change to page:', page);
  }

  getPageNumbers(): number[] {
    // Return empty array for now since we're using input data
    return [];
  }

  editCategory(category: Category): void {
    this.openEditModal.emit(category);
  }



  closeModal(): void {
    this.isSubmitting = false;
    this.categoryForm.reset({ isActive: true });
  }
} 