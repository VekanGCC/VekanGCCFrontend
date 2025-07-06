import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Requirement } from '../../../models/requirement.model';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';
import { SafePipe } from '../../../pipes/safe.pipe';

@Component({
  selector: 'app-requirement-details',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SafePipe],
  templateUrl: './requirement-details.component.html',
  styleUrls: ['./requirement-details.component.scss']
})
export class RequirementDetailsComponent implements OnInit {
  requirement: Requirement | null = null;
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
    this.loadRequirement();
  }

  private loadRequirement(): void {
    const requirementId = this.route.snapshot.paramMap.get('id');
    if (!requirementId) {
      this.errorMessage = 'No requirement ID provided';
      return;
    }

    this.isLoading = true;
    this.apiService.getRequirement(requirementId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.requirement = response.data;
          console.log('🔧 Requirement Details: Loaded requirement data:', this.requirement);
          console.log('🔧 Requirement Details: Client info:', {
            clientId: this.requirement?.clientId,
            clientName: this.requirement?.clientName,
            createdBy: this.requirement?.createdBy
          });
        } else {
          this.errorMessage = 'Requirement not found';
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading requirement:', error);
        this.errorMessage = 'Failed to load requirement';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/vendor/requirements']);
  }

  onDownloadAttachment(): void {
    if (this.requirement?.attachment?.fileId) {
      console.log('🔧 RequirementDetails: Downloading file with ID:', this.requirement.attachment.fileId);
      console.log('🔧 RequirementDetails: File name:', this.requirement.attachment.originalName);

      this.apiService.downloadFile(this.requirement.attachment.fileId).subscribe({
        next: (response: Blob) => {
          console.log('✅ RequirementDetails: File download successful, blob size:', response.size);
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(response);
          link.download = this.requirement!.attachment!.originalName;
          link.target = '_blank';
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ RequirementDetails: Download link clicked for file:', this.requirement!.attachment!.originalName);
        },
        error: (error) => {
          console.error('❌ RequirementDetails: Error downloading file:', error);
        }
      });
    } else {
      console.error('❌ RequirementDetails: No fileId found for attachment');
    }
  }

  onViewAttachment(): void {
    if (this.requirement?.attachment?.fileId) {
      const fileType = this.requirement.attachment.fileType?.toLowerCase() || '';
      
      if (fileType.includes('pdf')) {
        // For PDFs, create a blob URL from the download for inline viewing
        this.apiService.downloadFile(this.requirement.attachment.fileId).subscribe({
          next: (response: Blob) => {
            const blobUrl = URL.createObjectURL(response);
            this.embeddedViewerUrl = blobUrl;
            this.showEmbeddedViewer = true;
          },
          error: (error) => {
            console.error('❌ RequirementDetails: Error loading PDF for viewing:', error);
            // Fallback to opening in new tab
            window.open(`${environment.apiUrl}/files/${this.requirement!.attachment!.fileId}/download`, '_blank');
          }
        });
      } else {
        // For Word documents and other files, open in new tab
        // Microsoft Office Online viewer requires public URLs, which we can't provide securely
        window.open(`${environment.apiUrl}/files/${this.requirement.attachment.fileId}/download`, '_blank');
      }
    } else {
      console.error('❌ RequirementDetails: No fileId found for attachment');
    }
  }

  getCategoryName(category: any): string {
    if (typeof category === 'object' && category?.name) {
      return category.name;
    }
    return category || 'No Category';
  }

  getClientName(): string {
    // Check if clientName is available from backend
    if (this.requirement?.clientName && typeof this.requirement.clientName === 'string') {
      return this.requirement.clientName;
    }
    // Check if organizationId exists (this might be the client organization)
    if (this.requirement?.organizationId) {
      if (typeof this.requirement.organizationId === 'object' && this.requirement.organizationId.name) {
        return this.requirement.organizationId.name;
      }
      return `Organization ID: ${this.requirement.organizationId}`;
    }
    // Check if clientId exists
    if (this.requirement?.clientId) {
      return `Client ID: ${this.requirement.clientId}`;
    }
    return 'Not specified';
  }

  getContactPerson(): string {
    // Check if contactPerson is available from backend
    if (this.requirement?.contactPerson && typeof this.requirement.contactPerson === 'string') {
      return this.requirement.contactPerson;
    }
    // Check if createdBy is an object with user details
    if (this.requirement?.createdBy && typeof this.requirement.createdBy === 'object') {
      const firstName = this.requirement.createdBy.firstName || '';
      const lastName = this.requirement.createdBy.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }
    // Fallback to createdBy as string
    if (this.requirement?.createdBy) {
      return this.requirement.createdBy;
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
    // Check if contactEmail is available from backend
    if (this.requirement?.contactEmail && typeof this.requirement.contactEmail === 'string') {
      return this.requirement.contactEmail;
    }
    // Check if createdBy is an object with user details
    if (this.requirement?.createdBy && typeof this.requirement.createdBy === 'object') {
      return this.requirement.createdBy.email || 'Not specified';
    }
    return 'Not specified';
  }

  closeEmbeddedViewer(): void {
    this.showEmbeddedViewer = false;
    this.embeddedViewerUrl = '';
  }

  canEmbedFile(fileType: string): boolean {
    const type = fileType?.toLowerCase() || '';
    return type.includes('pdf') || type.includes('doc') || type.includes('docx');
  }

  isPdfFile(fileType: string | undefined): boolean {
    return fileType?.toLowerCase().includes('pdf') || false;
  }

  isWordFile(fileType: string | undefined): boolean {
    const type = fileType?.toLowerCase() || '';
    return type.includes('doc') || type.includes('docx');
  }

  getOfficeViewerUrl(): string {
    // For Word documents, we need to use the full URL with authentication
    // Microsoft Office Online viewer needs a publicly accessible URL
    // Since our download endpoint requires authentication, we'll need to handle this differently
    const downloadUrl = `${environment.apiUrl}/files/${this.requirement?.attachment?.fileId}/download`;
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`;
  }
} 