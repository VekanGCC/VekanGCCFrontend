export interface VendorSkill {
  _id: string;
  vendor: {
    _id: string;
    email: string;
    companyName: string;
    firstName: string;
    lastName: string;
  };
  skill: {
    _id: string;
    name: string;
    description: string;
    isActive: boolean;
  };
  category: string;
  description: string;
  yearsOfExperience: number;
  proficiency: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}