import { Donor } from '../types/donor';

/**
 * Real Server API client - replaces localStorage completely.
 * Data is persisted directly to the backend storage on disk (data/donors.json).
 */

export async function getDonors(): Promise<Donor[]> {
  const response = await fetch('/api/donors', {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load donors: ${response.statusText}`);
  }

  return response.json();
}

export async function createDonor(donorData: Omit<Donor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Donor> {
  const response = await fetch('/api/donors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(donorData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create donor: ${response.statusText}`);
  }

  return response.json();
}

export async function updateDonor(id: string, donorData: Partial<Donor>): Promise<Donor> {
  const response = await fetch(`/api/donors/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(donorData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update donor: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteDonor(id: string): Promise<boolean> {
  const response = await fetch(`/api/donors/${id}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete donor: ${response.statusText}`);
  }

  const result = await response.json();
  return result.success;
}
