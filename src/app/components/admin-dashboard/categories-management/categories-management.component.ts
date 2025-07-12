import { Component, OnInit } from '@angular/core';
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
  categories: Category[] = [];
  isLoading = false;
  error: string | null = null;
  
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
    console.log('🔧 CategoriesManagementComponent: ngOnInit called');
    this.loadCategories();
  }

  loadCategories(): void {
    console.log('🔄 CategoriesManagement: Loading categories...');
    this.isLoading = true;
    this.error = null;

    this.adminService.getCategories().subscribe({
      next: (response) => {
        console.log('✅ CategoriesManagement: Categories loaded:', response);
        if (response.success) {
          this.categories = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ CategoriesManagement: Error loading categories:', error);
        this.error = 'Failed to load categories';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    console.log('Search term:', this.searchTerm);
    // TODO: Implement search functionality
  }

  changePage(page: number): void {
    console.log('Change to page:', page);
    this.currentPage = page;
    this.loadCategories();
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const totalPages = this.pagination.totalPages || 1;
    const currentPage = this.pagination.page || 1;
    const pages: number[] = [];
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  editCategory(category: Category): void {
    console.log('Edit category:', category);
    // TODO: Implement edit functionality
  }

  closeModal(): void {
    this.isSubmitting = false;
    this.categoryForm.reset({ isActive: true });
  }

  refreshData(): void {
    this.loadCategories();
  }
} 