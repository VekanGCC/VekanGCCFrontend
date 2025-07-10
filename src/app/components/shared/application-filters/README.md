# Application Filters Component

This component provides a two-level filtering system for application screens with Active/Inactive tabs and individual status filters.

## Features

### Level 1: Category Tabs
- **Active Applications** - Shows ongoing applications (applied, pending, shortlisted, etc.)
- **Inactive Applications** - Shows completed/terminated applications (rejected, withdrawn, etc.)
- **All Applications** - Shows all applications regardless of status

### Level 2: Individual Status Filters
- **Dynamic checkboxes** based on selected category
- **Select/Deselect all** functionality
- **Search applications** by text
- **Active filter tags** with easy removal

## Usage

### 1. Import the Component
```typescript
import { ApplicationFiltersComponent, ApplicationFilters } from '../../shared/application-filters/application-filters.component';
```

### 2. Add to Component Imports
```typescript
@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [CommonModule, ApplicationFiltersComponent],
  // ...
})
```

### 3. Add to Template
```html
<app-application-filters
  [totalCounts]="applicationCounts"
  (filtersChanged)="onFiltersChanged($event)"
></app-application-filters>
```

### 4. Add to Component Class
```typescript
export class YourComponent {
  // Filtering properties
  currentFilters: ApplicationFilters = {
    category: 'active',
    statuses: [],
    searchTerm: undefined
  };
  applicationCounts = { active: 0, inactive: 0, all: 0 };

  constructor(private applicationStatusService: ApplicationStatusService) {}

  ngOnInit() {
    this.initializeFilters();
  }

  private initializeFilters() {
    this.applicationStatusService.getActiveStatuses().subscribe(activeStatuses => {
      this.currentFilters = {
        category: 'active',
        statuses: activeStatuses,
        searchTerm: undefined
      };
      this.loadApplicationCounts();
    });
  }

  private loadApplicationCounts() {
    this.applicationStatusService.getStatusMapping().subscribe(mapping => {
      this.applicationCounts = {
        active: mapping.active.length,
        inactive: mapping.inactive.length,
        all: mapping.all.length
      };
    });
  }

  onFiltersChanged(filters: ApplicationFilters) {
    this.currentFilters = filters;
    this.loadApplications(); // Your method to reload data
  }
}
```

## Integration Status

✅ **Vendor Applications** - Integrated and ready to use
✅ **Client Applications** - Integrated and ready to use

## Status Mapping

### Active Statuses
- `applied` - Application submitted and under review
- `pending` - Application is pending approval/review
- `shortlisted` - Resource has been shortlisted
- `interview` - Interview process is ongoing
- `accepted` - Application has been accepted
- `offer_created` - Offer has been created
- `offer_accepted` - Offer has been accepted
- `onboarded` - Resource has been onboarded

### Inactive Statuses
- `rejected` - Application was rejected
- `withdrawn` - Application was withdrawn by applicant
- `did_not_join` - Resource accepted but didn't join
- `cancelled` - Application was cancelled

## Styling

The component uses modern CSS with:
- Responsive design for mobile devices
- Clean, professional appearance
- Hover effects and transitions
- Accessible color schemes

## Dependencies

- `ApplicationStatusService` - For status mapping and categorization
- Angular Common Module
- Angular Forms Module 