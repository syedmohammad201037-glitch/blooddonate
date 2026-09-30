export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export type DonorStatus = 'Registered' | 'Confirmed' | 'Donated' | 'Deferred';

export type DonorType = 'regular' | 'walkin';

export type AdminRole = 'superadmin' | 'coordinator';

export interface DonorData {
  id?: string;
  tokenNumber: string;
  name: string;
  phone: string;
  cnic: string;
  address: string;
  bloodGroup: BloodGroup | string;
  status: DonorStatus;
  donorType?: DonorType;
  registeredAt: string;
  createdAt?: any;
  updatedAt?: any;
  notes?: string;
  bagNumber?: string;
  unitsDonated?: number;
  customFields?: Record<string, any>;
}

export interface PublicDonorToken {
  tokenNumber: string;
  maskedName: string;
  bloodGroup: BloodGroup | string;
  status: DonorStatus;
  campDate: string;
  venue: string;
  createdAt?: any;
}

export interface AdminProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: AdminRole;
  createdAt?: any;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'tel' | 'number' | 'select' | 'textarea';
  required: boolean;
  order: number;
  options?: string[];
  isSystem?: boolean;
  enabled: boolean;
  helpText?: string;
  /** Previous labels kept so existing donor custom-field values survive label edits. */
  legacyLabels?: string[];
}

export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
