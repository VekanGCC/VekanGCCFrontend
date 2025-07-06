import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FileService } from '../../services/file.service';
import { File as CustomFile } from '../../models/file.model';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @Input() entityType: string = '';
  @Input() entityId: string = '';
  @Input() category: string = 'other';
  @Input() description: string = '';
  @Input() isPublic: boolean = false;
  @Input() tags: string = '';
  @Input() maxFileSize: number = 5 * 1024 * 1024; // 5MB
  @Input() allowedTypes: string[] = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  @Input() multiple: boolean = false;
  @Input() showPreview: boolean = true;
  @Input() dragDropEnabled: boolean = true;

  @Output() fileUploaded = new EventEmitter<CustomFile>();
  @Output() uploadError = new EventEmitter<string>();
  @Output() uploadProgress = new EventEmitter<number>();

  files: globalThis.File[] = [];
  uploadedFiles: CustomFile[] = [];
  isDragging = false;
  isUploading = false;
  uploadProgressValue = 0;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fileService: FileService) {}

  ngOnInit(): void {
    this.fileService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.isUploading = loading;
    });

    this.fileService.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
      if (error) {
        this.uploadError.emit(error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: any): void {
    const selectedFiles = Array.from(event.target.files) as globalThis.File[];
    this.processFiles(selectedFiles);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      const droppedFiles = Array.from(event.dataTransfer.files) as globalThis.File[];
      this.processFiles(droppedFiles);
    }
  }

  private processFiles(files: globalThis.File[]): void {
    this.error = null;
    this.files = [];

    files.forEach(file => {
      // Validate file size
      if (file.size > this.maxFileSize) {
        this.error = `File ${file.name} is too large. Maximum size is ${this.fileService.formatFileSize(this.maxFileSize)}`;
        this.uploadError.emit(this.error);
        return;
      }

      // Validate file type
      if (!this.isFileTypeAllowed(file)) {
        this.error = `File type ${file.type} is not allowed`;
        this.uploadError.emit(this.error);
        return;
      }

      this.files.push(file);
    });

    if (this.files.length > 0) {
      this.uploadFiles();
    }
  }

  private isFileTypeAllowed(file: globalThis.File): boolean {
    return this.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '');
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });
  }

  private uploadFiles(): void {
    this.isUploading = true;
    this.uploadProgressValue = 0;

    const uploadPromises = this.files.map((file, index) => {
      const metadata = {
        category: this.category,
        description: this.description,
        isPublic: this.isPublic,
        tags: this.tags
      };

      return this.fileService.uploadFile(file, this.entityType, this.entityId, metadata).toPromise();
    });

    Promise.all(uploadPromises)
      .then(results => {
        results.forEach((result, index) => {
          if (result?.success && result.data) {
            this.uploadedFiles.push(result.data);
            this.fileUploaded.emit(result.data);
          }
        });
        this.uploadProgressValue = 100;
        this.uploadProgress.emit(100);
        this.files = [];
      })
      .catch(error => {
        this.error = error.message || 'Upload failed';
        this.uploadError.emit(this.error || 'Upload failed');
      })
      .finally(() => {
        this.isUploading = false;
        this.uploadProgressValue = 0;
      });
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  removeUploadedFile(fileId: string): void {
    this.uploadedFiles = this.uploadedFiles.filter(file => file._id !== fileId);
  }

  getFileIcon(file: globalThis.File): string {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return this.fileService.getFileIcon(extension || '');
  }

  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  isImageFile(file: globalThis.File): boolean {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return this.fileService.isImageFile(extension || '');
  }

  getImagePreview(file: globalThis.File): string {
    return URL.createObjectURL(file);
  }
} 