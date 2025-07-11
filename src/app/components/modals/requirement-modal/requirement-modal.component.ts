import { Component, EventEmitter, Output, OnInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { AppService } from '../../../services/app.service';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin.model';
import { ApiResponse } from '../../../models/api-response.model';
import { FormatEnumPipe } from '../../../pipes/format-enum.pipe';
import { Requirement } from '../../../models/requirement.model';

@Component({
  selector: 'app-requirement-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule, FormatEnumPipe],
  templateUrl: './requirement-modal.component.html',
  styleUrls: ['./requirement-modal.component.css']
})
export class RequirementModalComponent implements OnInit, OnChanges {
  @Input() requirement: Requirement | null = null;
  @Input() mode: 'create' | 'edit' | 'close' = 'create';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<Requirement>();

  requirementForm: FormGroup;
  availableSkills: AdminSkill[] = [];
  availableCategories: any[] = [];
  formPopulated = false; // Flag to prevent multiple population calls
  
  // Search dropdown properties
  showCategoryDropdown = false;
  activeSkillDropdown: number | null = null;
  categorySearchTerm = '';
  skillSearchTerm = '';
  filteredCategories: any[] = [];
  filteredSkills: AdminSkill[] = [];
  
  // File upload properties
  selectedFile: File | null = null;
  fileError: string | null = null;
  readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  readonly allowedFileTypes = ['.pdf', '.doc', '.docx'];
  
  experienceLevels = [
    'junior',
    'mid',
    'senior',
    'expert'
  ];

  // Get today's date in YYYY-MM-DD format for date input min attribute
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private appService: AppService,
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.requirementForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      skills: this.fb.array([this.fb.control('', Validators.required)]),
      experience: this.fb.group({
        minYears: [1, [Validators.required, Validators.min(0), Validators.max(50)]],
        level: ['junior', Validators.required]
      }),
      location: ['', Validators.required],
      timeline: this.fb.group({
        duration: [6, [Validators.required, Validators.min(1), Validators.max(36)]],
        start_date: [this.today, Validators.required]
      }),
      budget: this.fb.group({
        charge: [50, [Validators.required, Validators.min(1), Validators.max(500)]],
        currency: ['USD'],
        type: ['hourly']
      }),
      work_preference: this.fb.group({
        remote: [true],
        onsite: [true],
        hybrid: [true]
      }),
      description: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  ngOnInit(): void {
    // Load available skills from API first
    this.apiService.get<ApiResponse<AdminSkill[]>>('/skills/active').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSkills = response.data;
          
          // After skills are loaded, populate the form if in edit mode
          if (this.mode === 'edit' && this.requirement && !this.formPopulated) {
            this.tryPopulateForm();
          }
        } else {
          console.error('🔧 RequirementModal: Failed to load skills:', response);
        }
      },
      error: (error) => {
        console.error('🔧 RequirementModal: Error loading skills:', error);
      }
    });

    // Load available categories from API service (public endpoint)
    this.apiService.getActiveCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableCategories = response.data;
          
          // After categories are loaded, populate the form if in edit mode
          if (this.mode === 'edit' && this.requirement && !this.formPopulated) {
            this.tryPopulateForm();
          }
        } else {
          console.error('🔧 RequirementModal: Failed to load categories:', response.message);
        }
      },
      error: (error) => {
        console.error('🔧 RequirementModal: Error loading categories:', error);
      }
    });
  }

  tryPopulateForm(): void {
    // Only populate if both skills and categories are loaded and we haven't populated yet
    if (this.availableSkills.length > 0 && this.availableCategories.length > 0 && !this.formPopulated) {
      this.populateForm();
      this.formPopulated = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle when requirement input changes (e.g., when modal opens with new requirement)
    if (changes['requirement'] && changes['requirement'].currentValue && this.mode === 'edit') {
      // Reset the formPopulated flag when a new requirement is provided
      this.formPopulated = false;
      
      // If skills are already loaded, populate form immediately
      if (this.availableSkills.length > 0 && this.availableCategories.length > 0) {
        this.tryPopulateForm();
      }
      // If skills are not loaded yet, populateForm will be called after skills load in ngOnInit
    }
  }

  private populateForm(): void {
    if (!this.requirement) {
      return;
    }

    // Clear existing skills FormArray and add the requirement's skills
    while (this.skills.length !== 0) {
      this.skills.removeAt(0);
    }
    
    // Add each skill from the requirement - handle both string and object formats
    this.requirement.skills.forEach((skill: any) => {
      // If skill is an object, use its _id, otherwise use the skill string
      const skillId = typeof skill === 'object' ? skill._id : skill;
      this.skills.push(this.fb.control(skillId, Validators.required));
    });

    // If no skills, add at least one empty skill field
    if (this.skills.length === 0) {
      this.skills.push(this.fb.control('', Validators.required));
    }

    // Patch the form with individual values to ensure proper updates
    this.requirementForm.patchValue({
      title: this.requirement.title,
      category: (this.requirement.category as any)?._id || this.requirement.category, // Handle both object and string
      location: (this.requirement.location as any)?.city || this.requirement.location,
      timeline: {
        duration: typeof this.requirement.duration === 'string' ? parseInt(this.requirement.duration) : this.requirement.duration || 6,
        start_date: this.requirement.startDate ? new Date(this.requirement.startDate).toISOString().split('T')[0] : this.today
      },
      budget: {
        charge: (this.requirement.budget as any)?.charge || this.requirement.budget?.charge || 50,
        currency: (this.requirement.budget as any)?.currency || 'USD',
        type: (this.requirement.budget as any)?.type || 'hourly'
      },
      work_preference: {
        remote: true,
        onsite: true,
        hybrid: true
      },
      description: this.requirement.description
    });

    // Set experience values separately to ensure proper FormGroup update
    this.experience.setValue({
      minYears: (this.requirement.experience as any)?.minYears || (this.requirement.experience as any)?.years || 1,
      level: (this.requirement.experience as any)?.level || 'junior'
    });

    // Handle existing attachment if in edit mode
    if (this.mode === 'edit' && this.requirement.attachment) {
      // Note: We can't set selectedFile directly since it's a File object, not attachment data
      // Instead, we'll show the existing attachment in the template
    }

    // Force change detection to update the form
    this.changeDetectorRef.detectChanges();
  }

  get skills(): FormArray {
    return this.requirementForm.get('skills') as FormArray;
  }

  get experience(): FormGroup {
    return this.requirementForm.get('experience') as FormGroup;
  }

  get timeline(): FormGroup {
    return this.requirementForm.get('timeline') as FormGroup;
  }

  get descriptionCharacterCount(): number {
    const description = this.requirementForm.get('description')?.value || '';
    return description.length;
  }

  get descriptionMaxLength(): number {
    return 2000;
  }

  // Make Math available in template
  Math = Math;

  onDescriptionChange(): void {
    // This method can be called when description changes for additional logic if needed
    const currentCount = this.descriptionCharacterCount;
    if (currentCount > this.descriptionMaxLength) {
      console.warn(`Description exceeds ${this.descriptionMaxLength} characters: ${currentCount}`);
    }
  }

  addSkill(): void {
    this.skills.push(this.fb.control('')); // Remove Validators.required initially
    // Force change detection to ensure the new field appears immediately
    this.changeDetectorRef.detectChanges();
  }

  removeSkill(index: number): void {
    if (this.skills.length > 1) {
      this.skills.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.mode === 'close' && this.requirement) {
      // For close mode, just emit the requirement with cancelled status
      this.confirm.emit({ ...this.requirement, status: 'cancelled' });
      this.close.emit();
      return;
    }

    // Check if the main form fields are valid (excluding skills array)
    const mainFormValid = this.requirementForm.get('title')?.valid &&
                         this.requirementForm.get('category')?.valid &&
                         this.requirementForm.get('experience')?.valid &&
                         this.requirementForm.get('location')?.valid &&
                         this.requirementForm.get('timeline')?.valid &&
                         this.requirementForm.get('budget')?.valid &&
                         this.requirementForm.get('description')?.valid;

    if (mainFormValid) {
      const user = this.authService.currentUser;
      if (!user) return;

      const formValue = this.requirementForm.value;
      
      // Filter out empty skills and validate that at least one skill is selected
      const filteredSkills = formValue.skills.filter((skill: string) => skill && skill.trim() !== '');

      if (filteredSkills.length === 0) {
        console.error('🔧 RequirementModal: At least one skill must be selected');
        return;
      }

      // Validate that category and skills are ObjectIds
      if (!formValue.category || formValue.category === '') {
        console.error('🔧 RequirementModal: Category is required but not selected');
        return;
      }

      // Check if category is a valid ObjectId (24 character hex string)
      if (!/^[0-9a-fA-F]{24}$/.test(formValue.category)) {
        console.error('🔧 RequirementModal: Category is not a valid ObjectId:', formValue.category);
        return;
      }

      // Check if all skills are valid ObjectIds
      const invalidSkills = filteredSkills.filter((skill: string) => !/^[0-9a-fA-F]{24}$/.test(skill));
      if (invalidSkills.length > 0) {
        console.error('🔧 RequirementModal: Some skills are not valid ObjectIds:', invalidSkills);
        return;
      }

      const requirementData = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category, // This should now be a valid ObjectId
        skills: filteredSkills, // These should now be valid ObjectIds
        experience: {
          minYears: formValue.experience.minYears,
          level: formValue.experience.level
        },
        location: {
          city: formValue.location,
          state: '',
          country: 'USA',
          remote: true
        },
        duration: formValue.timeline.duration,
        budget: {
          charge: formValue.budget.charge,
          currency: formValue.budget.currency,
          type: formValue.budget.type
        },
        clientId: user._id,
        clientName: user.businessInfo?.companyName || 'Unknown Company',
        status: 'active' as const,
        createdBy: user._id,
        startDate: formValue.timeline.start_date ? new Date(formValue.timeline.start_date).toISOString() : new Date().toISOString(),
        endDate: this.calculateEndDate(formValue.timeline.start_date, formValue.timeline.duration)
      };

      if (this.mode === 'edit' && this.requirement) {
        // If a new file is selected, upload it first
        if (this.selectedFile) {
          this.apiService.uploadFile(this.selectedFile, 'requirement', this.requirement._id, {
            category: 'document',
            description: `Requirement document for: ${requirementData.title}`,
            isPublic: false
          }).subscribe({
            next: (fileResponse: any) => {
              if (fileResponse.success && fileResponse.data) {
                // Update the requirement data with new file information
                const updatedRequirement: Requirement = {
                  ...this.requirement!,
                  ...requirementData,
                  attachment: {
                    fileId: fileResponse.data._id,
                    filename: fileResponse.data.filename,
                    path: fileResponse.data.path,
                    originalName: fileResponse.data.originalName,
                    fileSize: fileResponse.data.size,
                    fileType: fileResponse.data.mimetype
                  }
                };
                
                this.confirm.emit(updatedRequirement);
                this.close.emit();
              } else {
                console.error('❌ Failed to upload new file. Please try again.');
              }
            },
            error: (error: any) => {
              console.error('❌ Failed to upload new file. Please try again.');
            }
          });
        } else {
          // No new file selected, check if existing attachment was removed
          const updatedRequirement: Requirement = {
            ...this.requirement!,
            ...requirementData
          };
          
          // If existing attachment was removed (set to undefined), ensure it's not included
          if (this.requirement.attachment === undefined) {
            updatedRequirement.attachment = undefined;
          } else if (this.requirement.attachment) {
            // Keep existing attachment
            updatedRequirement.attachment = this.requirement.attachment;
          }
          
          this.confirm.emit(updatedRequirement);
          this.close.emit();
        }
      } else if (this.mode === 'create') {
        // Step 1: Create the requirement first
        this.apiService.createRequirement(requirementData).subscribe({
          next: (response: any) => {
            if (response.success && response.data) {
              const requirementId = response.data._id;
              
              // Step 2: If file is selected, upload it with the requirement ID
              if (this.selectedFile) {
                this.apiService.uploadFile(this.selectedFile, 'requirement', requirementId, {
                  category: 'document',
                  description: `Requirement document for: ${requirementData.title}`,
                  isPublic: false
                }).subscribe({
                  next: (fileResponse: any) => {
                    if (fileResponse.success && fileResponse.data) {
                      // Step 3: Update the requirement with file information
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
                      
                      this.apiService.updateRequirement(requirementId, updateData).subscribe({
                        next: (updateResponse: any) => {
                          // Emit the created requirement with file attachment
                          const createdRequirement: Requirement = {
                            ...response.data,
                            attachment: {
                              fileId: fileResponse.data._id,
                              filename: fileResponse.data.filename,
                              path: fileResponse.data.path,
                              originalName: fileResponse.data.originalName,
                              fileSize: fileResponse.data.size,
                              fileType: fileResponse.data.mimetype
                            }
                          };
                          this.confirm.emit(createdRequirement);
                          this.close.emit();
                        },
                        error: (error: any) => {
                          console.error('❌ Requirement created but failed to attach file. Please try again.');
                        }
                      });
                    } else {
                      console.error('❌ Requirement created but file upload failed. Please try again.');
                    }
                  },
                  error: (error: any) => {
                    console.error('❌ Requirement created but file upload failed. Please try again.');
                  }
                });
              } else {
                // No file selected, requirement creation is complete
                // Emit the created requirement
                this.confirm.emit(response.data);
                this.close.emit();
              }
            } else {
              console.error('❌ Failed to create requirement. Please try again.');
            }
          },
          error: (error: any) => {
            console.error('❌ Failed to create requirement. Please try again.');
          }
        });
      }
    }
  }

  onClose(): void {
    this.close.emit();
    // Force change detection to ensure modal closes immediately
    this.changeDetectorRef.detectChanges();
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
    const fileInput = document.getElementById('requirement-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  downloadFile(attachment: any): void {
    if (!attachment || !attachment.fileId) {
      console.error('🔧 RequirementModal: No file ID found for download');
      return;
    }
    
    // Use the API service to download the file
    this.apiService.downloadFile(attachment.fileId).subscribe({
      next: (response: Blob) => {
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(response);
        link.download = attachment.originalName || 'download';
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
      },
      error: (error: any) => {
        console.error('🔧 RequirementModal: File download error:', error);
        // Handle download error
      }
    });
  }

  removeExistingFile(): void {
    if (!this.requirement || !this.requirement.attachment) {
      return;
    }
    
    // Set a flag to indicate that the existing attachment should be removed
    // We'll handle this in the onSubmit method
    this.requirement.attachment = undefined;
    
    // Force change detection to update the UI
    this.changeDetectorRef.detectChanges();
  }

  // Helper method to debug form state
  private logFormState(): void {
    // Debug method - can be used for troubleshooting if needed
  }

  getSkillId(skill: any): string {
    return skill._id || skill.id || '';
  }

  // Debug method to check form validity
  checkFormValidity(): void {
    // Debug method - can be used for troubleshooting if needed
  }

  private calculateEndDate(startDate: string | null, duration: number): string {
    if (!startDate || !duration) {
      return new Date().toISOString();
    }

    const endDate = new Date(new Date(startDate).getTime() + duration * 30 * 24 * 60 * 60 * 1000);
    return endDate.toISOString();
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

  selectCategory(category: any): void {
    this.requirementForm.patchValue({ category: category._id });
    this.showCategoryDropdown = false;
    this.categorySearchTerm = '';
  }

  selectSkill(index: number, skill: AdminSkill): void {
    this.skills.at(index).setValue(this.getSkillId(skill));
    this.activeSkillDropdown = null;
    this.skillSearchTerm = '';
  }

  getCategoryDisplayName(): string {
    const categoryId = this.requirementForm.get('category')?.value;
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