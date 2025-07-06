import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// File Management Components
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { FileManagementComponent } from './components/file-management/file-management.component';
import { FileDemoComponent } from './components/file-demo/file-demo.component';

// Vendor Components
import { AddEmployeeModalComponent } from './components/vendor-dashboard/add-employee-modal/add-employee-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    FileUploadComponent,
    FileManagementComponent,
    FileDemoComponent,
    AddEmployeeModalComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { } 