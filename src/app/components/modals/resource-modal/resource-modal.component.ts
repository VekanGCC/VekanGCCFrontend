import { Component, EventEmitter, Output, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { AppService } from '../../../services/app.service';
import { AdminService } from '../../../services/admin.service';
import { AdminSkill } from '../../../models/admin.model';
import { Category } from '../../../models/category.model';
import { ApiService } from '../../../services/api.service';
import { Resource } from '../../../models/resource.model';

@Component({
  selector: 'app-resource-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './resource-modal.component.html',
  styleUrls: ['./resource-modal.component.css']
})
export class ResourceModalComponent implements OnInit {
  @Input() resourceToEdit: Resource | null = null;
  @Output() close = new EventEmitter<void>();

  resourceForm: FormGroup;
  availableSkills: AdminSkill[] = [];
  availableCategories: Category[] = [];
  isSubmitting = false;
  isEditMode = false;
  formPopulated = false; // Flag to prevent multiple population calls
  
  // Search dropdown properties
  showCategoryDropdown = false;
  activeSkillDropdown: number | null = null;
  categorySearchTerm = '';
  skillSearchTerm = '';
  filteredCategories: Category[] = [];
  filteredSkills: AdminSkill[] = [];
  
  // File upload properties
  selectedFile: File | null = null;
  existingFile: any = null; // Track existing file when editing
  fileError: string | null = null;
  readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  readonly allowedFileTypes = ['.pdf', '.doc', '.docx'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private appService: AppService,
    private adminService: AdminService,
    private apiService: ApiService
  ) {
    this.resourceForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      skills: this.fb.array([this.fb.control('', Validators.required)]),
      experience: this.fb.group({
        years: [1, [Validators.required, Validators.min(0), Validators.max(50)]],
        level: ['junior', Validators.required]
      }),
      location: this.fb.group({
        city: [''],
        state: [''],
        country: [''],
        remote: [true]
      }),
      availability: this.fb.group({
        status: ['available', Validators.required],
        hours_per_week: [40, [Validators.min(0), Validators.max(168)]],
        start_date: ['']
      }),
      rate: this.fb.group({
        hourly: [50, [Validators.required, Validators.min(1), Validators.max(500)]],
        currency: ['USD']
      }),
      description: ['', Validators.required],
      status: ['active']
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.resourceToEdit;
    this.loadSkills();
    this.loadCategories();
  }

  initializeForm(): void {
    // This method is no longer needed as we moved the logic to loadSkills and loadCategories
  }

  loadSkills(): void {
    // Load available skills from admin service
    this.apiService.getActiveSkills().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableSkills = response.data;
          
          // If we're in edit mode and have a resource to edit, populate the form now
          if (this.isEditMode && this.resourceToEdit && !this.formPopulated) {
            this.tryPopulateForm();
          }
        } else {
          console.error('Resource Modal: Failed to load skills:', response.message);
        }
      },
      error: (error) => {
        console.error('Resource Modal: Error loading skills:', error);
      }
    });
  }

  loadCategories(): void {
    // Load available categories from API service (public endpoint)
    this.apiService.getActiveCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableCategories = response.data;
          
          // If we're in edit mode and have a resource to edit, populate the form now
          if (this.isEditMode && this.resourceToEdit && !this.formPopulated) {
            this.tryPopulateForm();
          }
        } else {
          console.error('Resource Modal: Failed to load categories:', response.message);
        }
      },
      error: (error) => {
        console.error('Resource Modal: Error loading categories:', error);
      }
    });
  }

  tryPopulateForm(): void {
    // Only populate if both skills and categories are loaded and we haven't populated yet
    if (this.availableSkills.length > 0 && this.availableCategories.length > 0 && !this.formPopulated) {
      this.populateFormWithResource(this.resourceToEdit!);
      this.formPopulated = true;
    }
  }

  get skills(): FormArray {
    return this.resourceForm.get('skills') as FormArray;
  }

  addSkill(): void {
    this.skills.push(this.fb.control('', Validators.required));
  }

  removeSkill(index: number): void {
    if (this.skills.length > 1) {
      this.skills.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.resourceForm.valid) {
      // Check if skills are loaded
      if (this.availableSkills.length === 0) {
        console.error('🔧 ResourceModal: No skills available. Please wait for skills to load.');
        this.isSubmitting = false;
        return;
      }
      
      this.isSubmitting = true;
      const formValue = this.resourceForm.value;
      
      // Validate required fields
      if (!formValue.skills || formValue.skills.length === 0 || formValue.skills.some((skill: any) => !skill || skill === '')) {
        console.error('🔧 ResourceModal: Skills are required but not selected');
        this.isSubmitting = false;
        return;
      }
      
      if (!formValue.category || formValue.category === '') {
        console.error('🔧 ResourceModal: Category is required but not selected');
        this.isSubmitting = false;
        return;
      }
      
      // Prepare resource data without attachment
      const selectedSkills = formValue.skills.filter((skill: any) => skill && skill !== '');
      
      const resourceData = {
        name: formValue.name,
        description: formValue.description,
        category: formValue.category,
        skills: selectedSkills,   // Array of skill ObjectIds
        experience: {
          years: formValue.experience.years,
          level: formValue.experience.level
        },
        location: {
          city: formValue.location.city,
          state: formValue.location.state,
          country: formValue.location.country,
          remote: formValue.location.remote
        },
        availability: {
          status: formValue.availability.status,
          hours_per_week: formValue.availability.hours_per_week,
          start_date: formValue.availability.start_date
        },
        rate: {
          hourly: formValue.rate.hourly,
          currency: formValue.rate.currency
        },
        status: 'active',
        vendorName: 'Unknown Company'
      };

      if (this.isEditMode && this.resourceToEdit) {
        // Update existing resource
        
        // First, update the resource data
        this.apiService.updateResource(this.resourceToEdit._id, resourceData).subscribe({
          next: (response) => {
            // If a new file is selected, upload it
            if (this.selectedFile) {
              this.apiService.uploadFile(this.selectedFile, 'resource', this.resourceToEdit!._id, {
                category: 'document',
                description: `Resource document for: ${resourceData.name}`,
                isPublic: false
              }).subscribe({
                next: (fileResponse) => {
                  if (fileResponse.success && fileResponse.data) {
                    // Update the resource with file information
                    const updateData = {
                      attachment: {
                        fileId: fileResponse.data._id,
                        filename: fileResponse.data.filename,
                        path: fileResponse.data.path,
                        originalName: fileResponse.data.originalName,
                        fileSize: fileResponse.data.size,
                        fileType: fileResponse.data.mimetype
                      }
                    };
                    
                    this.apiService.updateResource(this.resourceToEdit!._id, updateData).subscribe({
                      next: (updateResponse) => {
                        this.isSubmitting = false;
                        this.close.emit();
                      },
                      error: (error) => {
                        console.error('🔧 ResourceModal: Error updating resource with file info:', error);
                        this.isSubmitting = false;
                        console.error('❌ Resource updated but failed to attach file. Please try again.');
                      }
                    });
                  } else {
                    this.isSubmitting = false;
                    console.error('❌ Resource updated but file upload failed. Please try again.');
                  }
                },
                error: (error) => {
                  console.error('🔧 ResourceModal: File upload error:', error);
                  this.isSubmitting = false;
                  console.error('❌ Resource updated but file upload failed. Please try again.');
                }
              });
            } else if (this.existingFile === null && this.resourceToEdit?.attachment) {
              // Existing file was removed, update resource to remove attachment
              const updateData = {
                attachment: null
              };
              
              this.apiService.updateResource(this.resourceToEdit._id, updateData).subscribe({
                next: (updateResponse) => {
                  this.isSubmitting = false;
                  this.close.emit();
                },
                error: (error) => {
                  console.error('🔧 ResourceModal: Error removing file from resource:', error);
                  this.isSubmitting = false;
                  console.error('❌ Resource updated but failed to remove file. Please try again.');
                }
              });
            } else {
              // No new file selected and no existing file removed, update is complete
              this.isSubmitting = false;
              this.close.emit();
            }
          },
          error: (error) => {
            console.error('🔧 ResourceModal: Resource update error:', error);
            this.isSubmitting = false;
            console.error('❌ Failed to update resource. Please try again.');
          }
        });
      } else {
        // Create new resource

        // Step 1: Create the resource first
        this.apiService.createResource(resourceData).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const resourceId = response.data._id;
              
              // Step 2: If file is selected, upload it with the resource ID
              if (this.selectedFile) {
                this.apiService.uploadFile(this.selectedFile, 'resource', resourceId, {
                  category: 'document',
                  description: `Resource document for: ${resourceData.name}`,
                  isPublic: false
                }).subscribe({
                  next: (fileResponse) => {
                    if (fileResponse.success && fileResponse.data) {
                      // Step 3: Update the resource with file information
                      const updateData = {
                        attachment: {
                          fileId: fileResponse.data._id,
                          filename: fileResponse.data.filename,
                          path: fileResponse.data.path,
                          originalName: fileResponse.data.originalName,
                          fileSize: fileResponse.data.size,
                          fileType: fileResponse.data.mimetype
                        }
                      };
                      
                      this.apiService.updateResource(resourceId, updateData).subscribe({
                        next: (updateResponse) => {
                          this.isSubmitting = false;
                          this.close.emit();
                        },
                        error: (error) => {
                          console.error('🔧 ResourceModal: Error updating resource with file info:', error);
                          this.isSubmitting = false;
                          console.error('❌ Resource created but failed to attach file. Please try again.');
                        }
                      });
                    } else {
                      this.isSubmitting = false;
                      console.error('❌ Resource created but file upload failed. Please try again.');
                    }
                  },
                  error: (error) => {
                    console.error('🔧 ResourceModal: File upload error:', error);
                    this.isSubmitting = false;
                    console.error('❌ Resource created but file upload failed. Please try again.');
                  }
                });
              } else {
                // No file selected, resource creation is complete
                this.isSubmitting = false;
                this.close.emit();
              }
            } else {
              this.isSubmitting = false;
              console.error('❌ Failed to create resource. Please try again.');
            }
          },
          error: (error) => {
            console.error('🔧 ResourceModal: Resource creation error:', error);
            this.isSubmitting = false;
            console.error('❌ Failed to create resource. Please try again.');
          }
        });
      }
    }
  }

  // File upload methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.fileError = null;

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedFileTypes.includes(fileExtension)) {
      this.fileError = 'Please select a PDF or DOC file only.';
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.fileError = 'File size must be less than 5MB.';
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileError = null;
    // Reset the file input
    const fileInput = document.getElementById('resource-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeExistingFile(): void {
    this.existingFile = null;
    this.fileError = null;
  }

  onClose(): void {
    this.close.emit();
  }

  getSkillId(skill: any): string {
    return skill._id || skill.id || '';
  }

  populateFormWithResource(resource: Resource): void {
    // Clear existing skills array and add the resource's skills
    while (this.skills.length !== 0) {
      this.skills.removeAt(0);
    }
    
    if (resource.skills && resource.skills.length > 0) {
      resource.skills.forEach((skill: any) => {
        const skillId = typeof skill === 'object' ? skill._id : skill;
        this.skills.push(this.fb.control(skillId, Validators.required));
      });
    } else {
      // Add at least one empty skill field
      this.skills.push(this.fb.control('', Validators.required));
    }
    
    // Format the start date if it exists
    let formattedStartDate = '';
    if (resource.availability?.start_date) {
      const startDate = new Date(resource.availability.start_date);
      if (!isNaN(startDate.getTime())) {
        formattedStartDate = startDate.toISOString().split('T')[0];
      }
    }
    
    // Populate the form with resource data
    this.resourceForm.patchValue({
      name: resource.name || '',
      category: resource.category?._id || resource.category || '',
      experience: {
        years: resource.experience?.years || 1,
        level: resource.experience?.level || 'junior'
      },
      location: {
        city: resource.location?.city || '',
        state: resource.location?.state || '',
        country: resource.location?.country || '',
        remote: resource.location?.remote || false
      },
      availability: {
        status: resource.availability?.status || 'available',
        hours_per_week: resource.availability?.hours_per_week || 40,
        start_date: formattedStartDate
      },
      rate: {
        hourly: resource.rate?.hourly || 50,
        currency: resource.rate?.currency || 'USD'
      },
      description: resource.description || '',
      status: resource.status || 'active'
    });
    
    // Set existing file if available
    if (resource.attachment) {
      this.existingFile = resource.attachment;
    }
  }

  // Search dropdown methods
  toggleCategoryDropdown(): void {
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.filteredCategories = [...this.availableCategories];
      this.categorySearchTerm = '';
    }
    this.activeSkillDropdown = null; // Close skill dropdown
  }

  toggleSkillDropdown(index: number): void {
    if (this.activeSkillDropdown === index) {
      this.activeSkillDropdown = null;
    } else {
      this.activeSkillDropdown = index;
      this.filteredSkills = [...this.availableSkills];
      this.skillSearchTerm = '';
    }
    this.showCategoryDropdown = false; // Close category dropdown
  }

  onCategorySearch(event: any): void {
    // This method is called when the main input is clicked
    this.toggleCategoryDropdown();
  }

  filterCategories(): void {
    if (!this.categorySearchTerm.trim()) {
      this.filteredCategories = [...this.availableCategories];
    } else {
      this.filteredCategories = this.availableCategories.filter(category =>
        category.name.toLowerCase().includes(this.categorySearchTerm.toLowerCase())
      );
    }
  }

  filterSkills(): void {
    if (!this.skillSearchTerm.trim()) {
      this.filteredSkills = [...this.availableSkills];
    } else {
      this.filteredSkills = this.availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(this.skillSearchTerm.toLowerCase())
      );
    }
  }

  selectCategory(category: Category): void {
    this.resourceForm.patchValue({ category: category._id });
    this.showCategoryDropdown = false;
    this.categorySearchTerm = '';
  }

  selectSkill(index: number, skill: AdminSkill): void {
    this.skills.at(index).setValue(this.getSkillId(skill));
    this.activeSkillDropdown = null;
    this.skillSearchTerm = '';
  }

  getCategoryDisplayName(): string {
    const categoryId = this.resourceForm.get('category')?.value;
    if (!categoryId) return '';
    
    const category = this.availableCategories.find(cat => cat._id === categoryId);
    return category ? category.name : '';
  }

  getSkillDisplayName(index: number): string {
    const skillId = this.skills.at(index).value;
    if (!skillId) return '';
    
    const skill = this.availableSkills.find(s => this.getSkillId(s) === skillId);
    return skill ? skill.name : '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any): void {
    // Close dropdowns when clicking outside
    if (!event.target.closest('.relative')) {
      this.showCategoryDropdown = false;
      this.activeSkillDropdown = null;
    }
  }
}