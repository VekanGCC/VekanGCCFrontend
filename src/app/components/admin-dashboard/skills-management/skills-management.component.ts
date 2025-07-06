import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSkill } from '../../../models/admin.model';

@Component({
  selector: 'app-skills-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills-management.component.html',
  styleUrls: ['./skills-management.component.scss']
})
export class SkillsManagementComponent {
  @Input() adminSkills: AdminSkill[] = [];

  @Output() editSkill = new EventEmitter<AdminSkill>();
  @Output() deleteSkill = new EventEmitter<string>();

  constructor() {}

  onEditSkill(skill: AdminSkill): void {
    this.editSkill.emit(skill);
  }

  onDeleteSkill(skillId: string): void {
    this.deleteSkill.emit(skillId);
  }

  trackById(index: number, item: any): string {
    return item.id || `item-${index}`;
  }
} 