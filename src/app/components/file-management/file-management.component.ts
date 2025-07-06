import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FileService } from '../../services/file.service';
import { File, FileFilters, FileUpdateRequest } from '../../models/file.model';
import { PaginatedResponse } from '../../models/pagination.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-file-management',
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.scss']
})
export class FileManagementComponent implements OnInit, OnDestroy {
  @Input() entityType: string = '';
  @Input() entityId: string = '';
  @Input() showUpload: boolean = true;
  @Input() showFilters: boolean = true;
  @Input() showActions: boolean = true;
  @Input() isAdmin: boolean = false;

  files: File[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 1;
  totalPages = 1;
  totalFiles = 0;
  itemsPerPage = 10;

  // Filters
  filters: FileFilters = {
    category: '',
    approvalStatus: '',
    page: 1,
    limit: 10
  };

  // Categories
  categories = [
    { value: '', label: 'All Categories' },
    { value: 'profile', label: 'Profile' },
    { value: 'document', label: 'Document' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'contract', label: 'Contract' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'other', label: 'Other' }
  ];

  // Approval statuses
  approvalStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Selected files for bulk actions
  selectedFiles: string[] = [];
  selectAll = false;

  private destroy$ = new Subject<void>();

  constructor(private fileService: FileService, private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFiles(): void {
    this.loading = true;
    this.error = null;

    const observable = this.entityType && this.entityId 
      ? this.fileService.getFilesByEntity(this.entityType, this.entityId, this.filters)
      : this.fileService.getMyFiles(this.filters);

    observable.subscribe({
      next: (response: PaginatedResponse<File>) => {
        this.files = response.data || [];
        this.currentPage = response.pagination?.page || 1;
        this.totalPages = response.pagination?.totalPages || 1;
        this.totalFiles = response.pagination?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load files';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadFiles();
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadFiles();
  }

  onFileUploaded(file: File): void {
    this.files.unshift(file);
    this.totalFiles++;
  }

  onFileDeleted(fileId: string): void {
    this.files = this.files.filter(f => f._id !== fileId);
    this.totalFiles--;
    this.selectedFiles = this.selectedFiles.filter(id => id !== fileId);
  }

  downloadFile(file: File): void {
    this.fileService.downloadFile(file._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.error = 'Failed to download file';
      }
    });
  }

  deleteFile(file: File): void {
    if (confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      this.fileService.deleteFile(file._id).subscribe({
        next: () => {
          this.onFileDeleted(file._id);
        },
        error: (error) => {
          this.error = 'Failed to delete file';
        }
      });
    }
  }

  updateFile(file: File, updates: FileUpdateRequest): void {
    this.fileService.updateFile(file._id, updates).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const index = this.files.findIndex(f => f._id === file._id);
          if (index !== -1) {
            this.files[index] = response.data;
          }
        }
      },
      error: (error) => {
        this.error = 'Failed to update file';
      }
    });
  }

  approveFile(file: File, approved: boolean): void {
    const approval = {
      approvalStatus: approved ? 'approved' as const : 'rejected' as const,
      approvalNotes: ''
    };

    this.fileService.approveFile(file._id, approval).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const index = this.files.findIndex(f => f._id === file._id);
          if (index !== -1) {
            this.files[index] = response.data;
          }
        }
      },
      error: (error) => {
        this.error = 'Failed to update approval status';
      }
    });
  }

  // Selection methods
  toggleFileSelection(fileId: string): void {
    const index = this.selectedFiles.indexOf(fileId);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    } else {
      this.selectedFiles.push(fileId);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedFiles = this.files.map(f => f._id);
    } else {
      this.selectedFiles = [];
    }
  }

  private updateSelectAllState(): void {
    this.selectAll = this.selectedFiles.length === this.files.length && this.files.length > 0;
  }

  // Bulk actions
  bulkDelete(): void {
    if (this.selectedFiles.length === 0) return;

    const count = this.selectedFiles.length;
    if (confirm(`Are you sure you want to delete ${count} file(s)?`)) {
      // Implement bulk delete
      this.selectedFiles.forEach(fileId => {
        this.fileService.deleteFile(fileId).subscribe({
          next: () => {
            this.onFileDeleted(fileId);
          },
          error: (error) => {
            this.error = 'Failed to delete some files';
          }
        });
      });
      this.selectedFiles = [];
    }
  }

  bulkApprove(approved: boolean): void {
    if (this.selectedFiles.length === 0) return;

    const approval = {
      fileIds: this.selectedFiles,
      approvalStatus: approved ? 'approved' as const : 'rejected' as const,
      approvalNotes: ''
    };

    this.fileService.bulkApproveFiles(approval).subscribe({
      next: () => {
        this.loadFiles(); // Reload to get updated statuses
        this.selectedFiles = [];
      },
      error: (error) => {
        this.error = 'Failed to update approval statuses';
      }
    });
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  getFileIcon(extension: string): string {
    return this.fileService.getFileIcon(extension);
  }

  isImageFile(extension: string): boolean {
    return this.fileService.isImageFile(extension);
  }

  getFilePreviewUrl(file: File): string {
    if (this.isImageFile(file.extension)) {
      return file.url;
    }
    return '';
  }

  clearError(): void {
    this.error = null;
  }

  // Test methods for debugging
  testBasicDownload(): void {
    this.apiService.testBasicDownload().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test-file.txt';
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('✅ Basic download test successful');
      },
      error: (error) => {
        console.error('❌ Basic download test failed:', error);
        this.error = 'Basic download test failed';
      }
    });
  }

  testFileDownload(file: File): void {
    this.apiService.testFileDownload(file._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-${file.originalName}`;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('✅ Test file download successful');
      },
      error: (error) => {
        console.error('❌ Test file download failed:', error);
        this.error = 'Test file download failed';
      }
    });
  }

  checkFileIntegrity(file: File): void {
    this.apiService.checkFileIntegrity(file._id).subscribe({
      next: (response) => {
        console.log('🔍 File integrity check:', response);
        alert(`File integrity check completed. Check console for details.`);
      },
      error: (error) => {
        console.error('❌ File integrity check failed:', error);
        this.error = 'File integrity check failed';
      }
    });
  }
} 