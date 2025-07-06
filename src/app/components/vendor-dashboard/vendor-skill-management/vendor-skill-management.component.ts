import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { VendorService } from '../../../services/vendor.service';
import { VendorSkill } from '../../../models/vendor-skill.model';
import { AddVendorSkillModalComponent } from '../../modals/add-vendor-skill-modal/add-vendor-skill-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vendor-skill-management',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AddVendorSkillModalComponent],
  templateUrl: './vendor-skill-management.component.html',
  styleUrls: ['./vendor-skill-management.component.scss']
})
export class VendorSkillManagementComponent implements OnInit, OnDestroy {
  vendorSkills: VendorSkill[] = [];
  loadingSkills = false;
  showAddSkillModal = false;
  private subscription = new Subscription();

  constructor(
    private vendorService: VendorService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔧 VendorSkillManagement: Initializing component');
    this.loadSkills();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadSkills(): void {
    console.log('🔧 VendorSkillManagement: Loading skills from service');
    this.loadingSkills = true;

    this.subscription.add(
      this.vendorService.getSkills().subscribe({
        next: (response: any) => {
          console.log('🔧 VendorSkillManagement: Skills loaded successfully:', response);
          if (response.success && response.data) {
            this.vendorSkills = response.data;
          } else {
            this.vendorSkills = [];
          }
          this.loadingSkills = false;
        },
        error: (error: any) => {
          console.error('🔧 VendorSkillManagement: Error loading skills:', error);
          this.vendorSkills = [];
          this.loadingSkills = false;
        }
      })
    );
  }

  onDeleteSkill(skillId: string): void {
    if (confirm('Are you sure you want to delete this skill?')) {
      console.log('🔧 VendorSkillManagement: Deleting skill:', skillId);
      this.subscription.add(
        this.vendorService.removeSkill(skillId).subscribe({
          next: (response: any) => {
            if (response.success) {
              console.log('🔧 VendorSkillManagement: Skill deleted successfully');
              // Remove the skill from the local array
              this.vendorSkills = this.vendorSkills.filter(skill => skill._id !== skillId);
            }
          },
          error: (error: any) => {
            console.error('🔧 VendorSkillManagement: Error deleting skill:', error);
          }
        })
      );
    }
  }

  getProficiencyClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'expert':
        return 'bg-green-100 text-green-800';
      case 'advanced':
        return 'bg-blue-100 text-blue-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'beginner':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getSkillStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onOpenAddSkillModal(): void {
    console.log('🔧 VendorSkillManagement: Opening add skill modal');
    this.showAddSkillModal = true;
  }

  onCloseAddSkillModal(): void {
    console.log('🔧 VendorSkillManagement: Closing add skill modal');
    this.showAddSkillModal = false;
  }

  onSkillAdded(skill: any): void {
    console.log('🔧 VendorSkillManagement: Skill added successfully:', skill);
    // Add the new skill to the local array
    this.vendorSkills = [...this.vendorSkills, skill];
    this.showAddSkillModal = false;
  }

  // Force refresh the component data
  refreshData(): void {
    console.log('🔧 VendorSkillManagement: Refreshing data');
    this.loadSkills();
  }

  trackById(index: number, item: VendorSkill): string {
    return item._id || `skill-${index}`;
  }
} 