import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { File, FileUpdateRequest, FileApprovalRequest, BulkApprovalRequest, FileFilters, FileStats } from '../models/file.model';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private filesSubject = new BehaviorSubject<File[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public files$ = this.filesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Upload file
  uploadFile(file: globalThis.File, entityType: string, entityId: string, metadata?: any): Observable<ApiResponse<File>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.uploadFile(file, entityType, entityId, metadata);
  }

  // Get files by entity
  getFilesByEntity(entityType: string, entityId: string, filters?: FileFilters): Observable<PaginatedResponse<File>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getFilesByEntity(entityType, entityId, filters);
  }

  // Get user's files
  getMyFiles(filters?: FileFilters): Observable<PaginatedResponse<File>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getMyFiles(filters);
  }

  // Get single file
  getFile(fileId: string): Observable<ApiResponse<File>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getFile(fileId);
  }

  // Download file
  downloadFile(fileId: string): Observable<Blob> {
    return this.apiService.downloadFile(fileId);
  }

  // Update file
  updateFile(fileId: string, updates: FileUpdateRequest): Observable<ApiResponse<File>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.updateFile(fileId, updates);
  }

  // Delete file
  deleteFile(fileId: string): Observable<ApiResponse<any>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.deleteFile(fileId);
  }

  // Admin: Get pending approvals
  getPendingApprovals(page?: number, limit?: number): Observable<PaginatedResponse<File>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getPendingFileApprovals(page, limit);
  }

  // Admin: Approve/reject file
  approveFile(fileId: string, approval: FileApprovalRequest): Observable<ApiResponse<File>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.approveFile(fileId, approval);
  }

  // Admin: Bulk approve/reject files
  bulkApproveFiles(approval: BulkApprovalRequest): Observable<ApiResponse<any>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.bulkApproveFiles(approval);
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(extension: string): string {
    const iconMap: { [key: string]: string } = {
      '.pdf': 'assets/icons/lucide/lucide/file-text.svg',
      '.doc': 'assets/icons/lucide/lucide/file-text.svg',
      '.docx': 'assets/icons/lucide/lucide/file-text.svg',
      '.txt': 'assets/icons/lucide/lucide/file-text.svg',
      '.jpg': 'assets/icons/lucide/lucide/image.svg',
      '.jpeg': 'assets/icons/lucide/lucide/image.svg',
      '.png': 'assets/icons/lucide/lucide/image.svg',
      '.gif': 'assets/icons/lucide/lucide/image.svg',
      '.xlsx': 'assets/icons/lucide/lucide/file-spreadsheet.svg',
      '.xls': 'assets/icons/lucide/lucide/file-spreadsheet.svg',
      '.csv': 'assets/icons/lucide/lucide/file-spreadsheet.svg',
      '.zip': 'assets/icons/lucide/lucide/archive.svg',
      '.rar': 'assets/icons/lucide/lucide/archive.svg',
      '.7z': 'assets/icons/lucide/lucide/archive.svg'
    };

    return iconMap[extension.toLowerCase()] || 'assets/icons/lucide/lucide/file.svg';
  }

  isImageFile(extension: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.includes(extension.toLowerCase());
  }

  isPdfFile(extension: string): boolean {
    return extension.toLowerCase() === '.pdf';
  }

  isDocumentFile(extension: string): boolean {
    const documentExtensions = ['.doc', '.docx', '.txt', '.rtf'];
    return documentExtensions.includes(extension.toLowerCase());
  }

  isSpreadsheetFile(extension: string): boolean {
    const spreadsheetExtensions = ['.xls', '.xlsx', '.csv'];
    return spreadsheetExtensions.includes(extension.toLowerCase());
  }

  // Set loading state
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // Set error
  setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  // Clear error
  clearError(): void {
    this.errorSubject.next(null);
  }

  // Update files in subject
  updateFiles(files: File[]): void {
    this.filesSubject.next(files);
  }

  // Add file to current list
  addFile(file: File): void {
    const currentFiles = this.filesSubject.value;
    this.filesSubject.next([file, ...currentFiles]);
  }

  // Remove file from current list
  removeFile(fileId: string): void {
    const currentFiles = this.filesSubject.value;
    const updatedFiles = currentFiles.filter(file => file._id !== fileId);
    this.filesSubject.next(updatedFiles);
  }

  // Update file in current list
  updateFileInList(updatedFile: File): void {
    const currentFiles = this.filesSubject.value;
    const updatedFiles = currentFiles.map(file => 
      file._id === updatedFile._id ? updatedFile : file
    );
    this.filesSubject.next(updatedFiles);
  }
} 