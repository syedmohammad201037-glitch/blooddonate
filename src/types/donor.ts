export type DonorType = 'regular' | 'walkin';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type DonorStatus = 'Available' | 'Donated' | 'Deferred' | 'Pending Screening';

export interface Donor {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  bloodGroup: BloodGroup;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  city: string;
  address?: string;
  donorType: DonorType;
  status: DonorStatus;

  // Walk-in specific attributes
  tokenNumber?: string;
  centerName?: string;
  walkinDate?: string;
  unitsDonated?: number;
  hemoglobin?: number;
  weight?: number;
  bagNumber?: string;
  referredPatient?: string;

  lastDonationDate?: string;
  totalDonations: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonorStats {
  totalDonors: number;
  regularDonors: number;
  walkinDonors: number;
  availableRegular: number;
  recentDonations: number;
  unitsCollected: number;
  deferredCount: number;
  bloodGroupCounts: Record<BloodGroup, number>;
}
