export interface Requirement {
  _id: string;
  clientId?: string;
  clientName?: string;
  clientType?: string;
  title: string;
  category: any; // Can be string or object with _id and name
  skills: any[]; // Can be string[] or object[] with _id and name
  experience: {
    minYears: number;
    level: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
    onsite?: boolean;
  };
  duration: number | string;
  budget: {
    charge: number;
    currency: string;
    type: string;
  };
  description: string;
  status: 'draft' | 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'active' | 'inactive';
  priority?: string;
  createdBy: any; // Can be string or object with user details
  organizationId?: any; // Can be string or object with organization details
  contactPerson?: string;
  contactEmail?: string;
  contactCompany?: string;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  attachment?: {
    originalName: string;
    fileSize: number;
    fileType: string;
    fileId?: string;
    filename?: string;
    path?: string;
  };
  applicationCount?: number;
  matchingResourcesCount?: number;
}