import { Component } from '@angular/core';

@Component({
  selector: 'app-file-demo',
  templateUrl: './file-demo.component.html',
  styleUrls: ['./file-demo.component.scss']
})
export class FileDemoComponent {
  // Demo entity for testing
  demoEntityType = 'user';
  demoEntityId = 'demo-user-123';
  isAdmin = false;

  onFileUploaded(file: any): void {
    console.log('File uploaded:', file);
  }

  onUploadError(error: string): void {
    console.error('Upload error:', error);
  }
} 