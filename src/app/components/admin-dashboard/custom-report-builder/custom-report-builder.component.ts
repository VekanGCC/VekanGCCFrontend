import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-custom-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './custom-report-builder.component.html',
  styleUrls: ['./custom-report-builder.component.css']
})
export class CustomReportBuilderComponent implements OnInit, OnDestroy {
  reportForm: FormGroup;
  isLoading = false;
  reportData: any = null;
  chart: Chart | null = null;
  
  // Available options
  dataSources = [
    { value: 'users', label: 'Users', icon: 'users' },
    { value: 'resources', label: 'Resources', icon: 'briefcase' },
    { value: 'requirements', label: 'Requirements', icon: 'file-text' },
    { value: 'applications', label: 'Applications', icon: 'clipboard-list' },
    { value: 'skills', label: 'Skills', icon: 'award' },
    { value: 'financial', label: 'Financial', icon: 'dollar-sign' }
  ];

  timeRanges = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'in', label: 'In' },
    { value: 'not_in', label: 'Not In' }
  ];

  aggregationTypes = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ];

  sortOrders = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' }
  ];

  // Report templates
  templates: any[] = [];
  selectedTemplate: any = null;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.reportForm = this.fb.group({
      dataSource: ['users', Validators.required],
      timeRange: ['month', Validators.required],
      startDate: [''],
      endDate: [''],
      filters: this.fb.array([]),
      groupBy: this.fb.array([]),
      aggregations: this.fb.array([]),
      sortBy: this.fb.group({
        field: [''],
        order: ['desc']
      }),
      limit: [100],
      includeFields: this.fb.array([]),
      excludeFields: this.fb.array([])
    });
  }

  ngOnInit(): void {
    console.log('🚀 Custom Report Builder initialized');
    this.loadTemplates();
    this.setupFormListeners();
    
    // Add a simple test to verify the component is working
    setTimeout(() => {
      console.log('🧪 Testing form state:', {
        valid: this.reportForm.valid,
        value: this.reportForm.value,
        errors: this.reportForm.errors
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyChart();
  }

  private setupFormListeners(): void {
    // Reset custom dates when time range changes
    this.reportForm.get('timeRange')?.valueChanges.subscribe(value => {
      if (value !== 'custom') {
        this.reportForm.patchValue({
          startDate: '',
          endDate: ''
        });
      }
    });
  }

  private loadTemplates(): void {
    this.subscriptions.add(
      this.apiService.getReportTemplates().subscribe({
        next: (response) => {
          this.templates = response.data || [];
        },
        error: (error) => {
          console.error('Error loading templates:', error);
        }
      })
    );
  }

  // Filter management
  get filters(): FormArray {
    return this.reportForm.get('filters') as FormArray;
  }

  addFilter(): void {
    const filterGroup = this.fb.group({
      field: ['', Validators.required],
      operator: ['equals', Validators.required],
      value: ['', Validators.required]
    });
    this.filters.push(filterGroup);
  }

  removeFilter(index: number): void {
    this.filters.removeAt(index);
  }

  // Group by management
  get groupBy(): FormArray {
    return this.reportForm.get('groupBy') as FormArray;
  }

  addGroupBy(): void {
    this.groupBy.push(this.fb.control('', Validators.required));
  }

  removeGroupBy(index: number): void {
    this.groupBy.removeAt(index);
  }

  // Aggregation management
  get aggregations(): FormArray {
    return this.reportForm.get('aggregations') as FormArray;
  }

  addAggregation(): void {
    const aggGroup = this.fb.group({
      field: ['', Validators.required],
      type: ['count', Validators.required],
      sourceField: ['']
    });
    this.aggregations.push(aggGroup);
  }

  removeAggregation(index: number): void {
    this.aggregations.removeAt(index);
  }

  // Field management
  get includeFields(): FormArray {
    return this.reportForm.get('includeFields') as FormArray;
  }

  addIncludeField(): void {
    this.includeFields.push(this.fb.control('', Validators.required));
  }

  removeIncludeField(index: number): void {
    this.includeFields.removeAt(index);
  }

  get excludeFields(): FormArray {
    return this.reportForm.get('excludeFields') as FormArray;
  }

  addExcludeField(): void {
    this.excludeFields.push(this.fb.control('', Validators.required));
  }

  removeExcludeField(index: number): void {
    this.excludeFields.removeAt(index);
  }

  // Template management
  loadTemplate(template: any): void {
    this.selectedTemplate = template;
    
    // Clear existing form arrays
    this.clearFormArrays();
    
    // Populate form with template data
    this.reportForm.patchValue({
      dataSource: template.dataSource,
      timeRange: template.defaultTimeRange,
      sortBy: template.defaultSortBy,
      limit: 100
    });

    // Add group by fields
    if (template.defaultGroupBy) {
      template.defaultGroupBy.forEach((field: string) => {
        this.groupBy.push(this.fb.control(field));
      });
    }

    // Add aggregations
    if (template.defaultAggregations) {
      template.defaultAggregations.forEach((agg: any) => {
        const aggGroup = this.fb.group({
          field: [agg.field],
          type: [agg.type],
          sourceField: [agg.sourceField || '']
        });
        this.aggregations.push(aggGroup);
      });
    }
  }

  private clearFormArrays(): void {
    while (this.filters.length) this.filters.removeAt(0);
    while (this.groupBy.length) this.groupBy.removeAt(0);
    while (this.aggregations.length) this.aggregations.removeAt(0);
    while (this.includeFields.length) this.includeFields.removeAt(0);
    while (this.excludeFields.length) this.excludeFields.removeAt(0);
  }

  // Generate report
  generateReport(): void {
    console.log('🔍 Form valid:', this.reportForm.valid);
    console.log('🔍 Form value:', this.reportForm.value);
    console.log('🔍 Form errors:', this.reportForm.errors);
    
    if (this.reportForm.valid) {
      this.isLoading = true;
      this.destroyChart();

      const formValue = this.reportForm.value;
      console.log('📊 Form value before processing:', formValue);
      
      // Convert form arrays to regular arrays
      const reportConfig = {
        ...formValue,
        filters: formValue.filters.map((f: any) => ({
          field: f.field,
          operator: f.operator,
          value: f.value
        })),
        groupBy: formValue.groupBy,
        aggregations: formValue.aggregations.map((a: any) => ({
          field: a.field,
          type: a.type,
          sourceField: a.sourceField
        })),
        includeFields: formValue.includeFields,
        excludeFields: formValue.excludeFields
      };

      console.log('📊 Report config being sent:', reportConfig);

      this.subscriptions.add(
        this.apiService.createCustomReport(reportConfig).subscribe({
          next: (response) => {
            console.log('📊 Custom report data received:', response);
            this.reportData = response.data;
            this.createChart();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error generating custom report:', error);
            this.isLoading = false;
          }
        })
      );
    } else {
      console.log('❌ Form is invalid:', this.reportForm.errors);
    }
  }

  private createChart(): void {
    if (!this.reportData || !this.reportData.report) return;

    const ctx = document.getElementById('customReportChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.destroyChart();

    const data = this.reportData.report;
    const metadata = this.reportData.metadata;

    // Determine chart type based on data structure
    let chartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
    let chartData: any = {};

    if (metadata.groupBy && metadata.groupBy.length > 0) {
      // Grouped data - use bar chart
      chartType = 'bar';
      chartData = {
        labels: data.map((item: any) => {
          if (metadata.groupBy.length === 1) {
            return item._id[metadata.groupBy[0]] || 'Unknown';
          } else {
            return metadata.groupBy.map((field: string) => 
              item._id[field] || 'Unknown'
            ).join(' - ');
          }
        }),
        datasets: [{
          label: metadata.aggregations[0]?.field || 'Count',
          data: data.map((item: any) => 
            item[metadata.aggregations[0]?.field || 'count'] || 0
          ),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      };
    } else {
      // Time series data - use line chart
      chartType = 'line';
      chartData = {
        labels: data.map((item: any) => item.date || item.createdAt),
        datasets: [{
          label: 'Count',
          data: data.map((item: any) => item.count || 1),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        }]
      };
    }

    this.chart = new Chart(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Custom Report - ${metadata.dataSource}`
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  // Save template
  saveTemplate(): void {
    if (this.reportForm.valid) {
      const formValue = this.reportForm.value;
      const templateData = {
        name: `Custom Report - ${new Date().toLocaleDateString()}`,
        description: 'Custom report template',
        dataSource: formValue.dataSource,
        timeRange: formValue.timeRange,
        filters: formValue.filters,
        groupBy: formValue.groupBy,
        aggregations: formValue.aggregations,
        sortBy: formValue.sortBy,
        limit: formValue.limit,
        includeFields: formValue.includeFields,
        excludeFields: formValue.excludeFields,
        isPublic: false
      };

      this.subscriptions.add(
        this.apiService.saveReportTemplate(templateData).subscribe({
          next: (response) => {
            console.log('Template saved:', response);
            this.loadTemplates(); // Reload templates
          },
          error: (error) => {
            console.error('Error saving template:', error);
          }
        })
      );
    }
  }

  // Export report
  exportReport(): void {
    if (!this.reportData) return;

    const data = this.reportData.report;
    const metadata = this.reportData.metadata;

    // Convert to CSV
    let csv = '';
    
    // Headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      csv += headers.join(',') + '\n';
      
      // Data rows
      data.forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        });
        csv += values.join(',') + '\n';
      });
    }

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-report-${metadata.dataSource}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper methods for template
  getDataSourceIcon(dataSource: string): string {
    const source = this.dataSources.find(s => s.value === dataSource);
    return source ? source.icon : 'database';
  }

  getTableHeaders(): string[] {
    if (!this.reportData || !this.reportData.report || this.reportData.report.length === 0) {
      return [];
    }
    return Object.keys(this.reportData.report[0]);
  }

  formatTableCell(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
} 