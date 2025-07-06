export interface VendorUser {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}