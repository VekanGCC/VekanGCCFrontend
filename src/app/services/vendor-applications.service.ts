import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Application } from '../models/application.model';
import { VendorService } from './vendor.service';

@Injectable({
  providedIn: 'root'
})
export class VendorApplicationsService {
  constructor(private vendorService: VendorService) {}

  // This service can be used for other application-related operations
  // The history modal is now handled directly in the vendor applications component
} 