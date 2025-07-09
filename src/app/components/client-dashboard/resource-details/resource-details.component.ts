import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Resource } from '../../../models/resource.model';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';
import { SafePipe } from '../../../pipes/safe.pipe';

@Component({
  selector: 'app-resource-details',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SafePipe],
  templateUrl: './resource-details.component.html',
  styleUrls: ['./resource-details.component.scss']
})
export class ResourceDetailsComponent implements OnInit {
  resource: Resource | null = null;
  isLoading = false;
  errorMessage = '';
  showEmbeddedViewer = false;
  embeddedViewerUrl = '';

  constructor(
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadResource();
  }

  private loadResource(): void {
    const resourceId = this.route.snapshot.paramMap.get('id');
    if (!resourceId) {
      this.errorMessage = 'No resource ID provided';
      return;
    }

    this.isLoading = true;
    this.apiService.getResource(resourceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.resource = response.data;
          console.log('🔧 Resource Details: Loaded resource data:', this.resource);
        } else {
          this.errorMessage = 'Resource not found';
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading resource:', error);
        this.errorMessage = 'Failed to load resource';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/client/resources']);
  }

  onDownloadAttachment(): void {
    if (this.resource?.attachment?.fileId) {
      console.log('🔧 ResourceDetails: Downloading file with ID:', this.resource.attachment.fileId);
      console.log('🔧 ResourceDetails: File name:', this.resource.attachment.originalName);

      this.apiService.downloadFile(this.resource.attachment.fileId).subscribe({
        next: (response: Blob) => {
          console.log('✅ ResourceDetails: File download successful, blob size:', response.size);
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(response);
          link.download = this.resource!.attachment!.originalName;
          link.target = '_blank';
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ ResourceDetails: Download link clicked for file:', this.resource!.attachment!.originalName);
        },
        error: (error) => {
          console.error('❌ ResourceDetails: Error downloading file:', error);
        }
      });
    } else {
      console.error('❌ ResourceDetails: No fileId found for attachment');
    }
  }

  onViewAttachment(): void {
    if (this.resource?.attachment?.fileId) {
      const fileType = this.resource.attachment.fileType?.toLowerCase() || '';
      
      if (fileType.includes('pdf')) {
        // For PDFs, create a blob URL from the download for inline viewing
        this.apiService.downloadFile(this.resource.attachment.fileId).subscribe({
          next: (response: Blob) => {
            const blobUrl = URL.createObjectURL(response);
            this.embeddedViewerUrl = blobUrl;
            this.showEmbeddedViewer = true;
          },
          error: (error) => {
            console.error('❌ ResourceDetails: Error loading PDF for viewing:', error);
            // Fallback to opening in new tab
            window.open(`${environment.apiUrl}/files/${this.resource!.attachment!.fileId}/download`, '_blank');
          }
        });
      } else {
        // For Word documents and other files, open in new tab
        window.open(`${environment.apiUrl}/files/${this.resource.attachment.fileId}/download`, '_blank');
      }
    } else {
      console.error('❌ ResourceDetails: No fileId found for attachment');
    }
  }

  getCategoryName(category: any): string {
    if (typeof category === 'object' && category?.name) {
      return category.name;
    }
    return category || 'No Category';
  }

  getVendorName(): string {
    // Check if createdBy contains vendor information
    if (this.resource?.createdBy) {
      if (typeof this.resource.createdBy === 'object' && (this.resource.createdBy as any).name) {
        return (this.resource.createdBy as any).name;
      }
      return `Vendor ID: ${this.resource.createdBy}`;
    }
    return 'Not specified';
  }

  getContactPerson(): string {
    // Check if createdBy is an object with user details
    if (this.resource?.createdBy && typeof this.resource.createdBy === 'object') {
      const firstName = (this.resource.createdBy as any).firstName || '';
      const lastName = (this.resource.createdBy as any).lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }
    // Fallback to createdBy as string
    if (this.resource?.createdBy) {
      return this.resource.createdBy;
    }
    return 'Not specified';
  }

  getSkillName(skill: any): string {
    if (typeof skill === 'object' && skill?.name) {
      return skill.name;
    }
    return skill || 'Unknown Skill';
  }

  getLocationDisplay(location: any): string {
    if (!location) return 'Not specified';
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  }

  getFileTypeIcon(fileType: string): string {
    if (fileType?.includes('pdf')) {
      return 'assets/icons/lucide/lucide/file-text.svg';
    } else if (fileType?.includes('doc') || fileType?.includes('docx')) {
      return 'assets/icons/lucide/lucide/file-text.svg';
    } else {
      return 'assets/icons/lucide/lucide/file.svg';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getContactEmail(): string {
    // Check if contact email is available in the contact object
    if (this.resource?.contact?.email) {
      return this.resource.contact.email;
    }
    // Check if createdBy is an object with user details
    if (this.resource?.createdBy && typeof this.resource.createdBy === 'object') {
      return (this.resource.createdBy as any).email || 'Not specified';
    }
    return 'Not specified';
  }

  closeEmbeddedViewer(): void {
    this.showEmbeddedViewer = false;
    this.embeddedViewerUrl = '';
  }

  isPdfFile(fileType: string | undefined): boolean {
    return fileType?.toLowerCase().includes('pdf') || false;
  }

  getAvailabilityClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'partially_available':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      case 'contract_ending_soon':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
} 