import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationState } from '../../models/pagination.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {
  @Input() paginationState!: PaginationState;
  @Output() pageChange = new EventEmitter<number>();

  get currentPage(): number {
    return this.paginationState.currentPage;
  }

  get pageSize(): number {
    return this.paginationState.pageSize;
  }

  get totalItems(): number {
    return this.paginationState.totalItems;
  }

  get totalPages(): number {
    return this.paginationState.totalPages;
  }

  get hasNextPage(): boolean {
    return this.paginationState.hasNextPage;
  }

  get hasPreviousPage(): boolean {
    return this.paginationState.hasPreviousPage;
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 7;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (this.currentPage > 4) {
        // Add ellipsis indicator (we'll handle this in template)
        pages.push(-1); // Use -1 to indicate ellipsis
      }
      
      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - 3) {
        // Add ellipsis indicator
        pages.push(-2); // Use -2 to indicate second ellipsis
      }
      
      // Show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  trackByPage(index: number, page: number): number {
    return page;
  }

  isEllipsis(page: number): boolean {
    return page === -1 || page === -2;
  }
} 