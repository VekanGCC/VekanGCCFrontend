import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img 
      [src]="iconPath" 
      [alt]="name"
      [class]="'w-4 h-4 ' + (className || '')"
      [style.width]="size + 'px'"
      [style.height]="size + 'px'">
  `
})
export class CustomIconComponent {
  @Input() name: string = '';
  @Input() size: number = 16;
  @Input() className: string = '';

  get iconPath(): string {
    return `/assets/icons/${this.name}.svg`;
  }
} 