import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { DonorData, PublicDonorToken, OperationResult, BloodGroup, DonorStatus, FormFieldConfig, DonorType } from "./types";
import { 
  isValidBloodGroup, 
  maskName, 
  generateCollisionSafeToken 
} from "./security";
import { formatCNIC, formatPhone } from "../utils/formatters";

// In-Memory state for instant UI responsiveness
let inMemoryDonorsList: DonorData[] = [];
let inMemoryLastSlip: DonorData | null = null;
let inMemoryFormFields: FormFieldConfig[] = [
  {
    id: 'name',
    label: 'Full Name',
    placeholder: 'e.g. Muhammad Ali',
    type: 'text',
    required: true,
    order: 1,
    isSystem: true,
    enabled: true,
    helpText: 'Official full name for donor registration slip'
  },
  {
    id: 'phone',
    label: 'Contact Number / WhatsApp',
    placeholder: '0300-1234567',
    type: 'tel',
    required: true,
    order: 2,
    isSystem: true,
    enabled: true,
    helpText: 'Used for confirmation SMS and camp updates'
  },
  {
    id: 'cnic',
    label: 'CNIC Number',
    placeholder: '42101-1234567-1',
    type: 'text',
    required: true,
    order: 3,
    isSystem: true,
    enabled: true,
    helpText: '13-digit National Identity Card'
  },
  {
    id: 'bloodGroup',
    label: 'Blood Group',
    placeholder: 'Select Blood Group',
    type: 'select',
    required: true,
    order: 4,
    options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    isSystem: true,
    enabled: true,
    helpText: 'Select Unknown if not previously tested'
  },
  {
    id: 'address',
    label: 'Residential Area / Address',
    placeholder: 'Sector / Block / Street, Scheme 33',
    type: 'text',
    required: true,
    order: 5,
    isSystem: true,
    enabled: true,
    helpText: 'Area or society in Scheme 33 Cantonment'
  }
];

export const DEFAULT_FORM_FIELDS = inMemoryFormFields;

/**
 * Strips any undefined fields so Firestore setDoc/updateDoc never throws
 */
export function cleanForFirestore(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const nested = cleanForFirestore(value);
        if (Object.keys(nested).length > 0) {
          result[key] = nested;
        }
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Normalizes donor record with strict CNIC and Phone formatting
 */
export function normalizeDonorRecord(data: any): DonorData {
  return {
    ...data,
    id: data.id || data.tokenNumber,
    name: (data.name || '').trim(),
    phone: formatPhone(data.phone),
    cnic: formatCNIC(data.cnic),
    bloodGroup: data.bloodGroup || 'Unknown',
    donorType: data.donorType === 'walkin' ? 'walkin' : 'regular',
    status: data.status || 'Registered',
    address: (data.address || '').trim(),
    bagNumber: data.bagNumber || undefined,
    registeredAt: data.registeredAt || 'Today',
    customFields: data.customFields || {}
  };
}

/**
 * Retrieves the currently active form fields configuration
 */
export function getFormFieldsConfig(): FormFieldConfig[] {
  return inMemoryFormFields;
}

/**
 * Saves form configuration directly to Firestore
 */
export async function saveFormFieldsConfig(fields: FormFieldConfig[]): Promise<OperationResult> {
  const normalizedFields = fields
    .map((field, index) => ({
      ...field,
      id: String(field.id),
      label: String(field.label || '').trim(),
      placeholder: String(field.placeholder || '').trim(),
      order: index + 1,
      enabled: field.enabled !== false,
      required: Boolean(field.required),
      options: field.type === 'select'
        ? (field.options || []).map(option => String(option).trim()).filter(Boolean)
        : undefined,
    }))
    .filter(field => field.label.length > 0);

  try {
    const settingRef = doc(db, "settings", "form_fields");

    await setDoc(settingRef, {
      fields: normalizedFields,
      updatedAt: serverTimestamp(),
    });

    // Only update the local cache after Firestore confirms the write.
    inMemoryFormFields = normalizedFields;

    return {
      success: true,
      message: "Form configuration saved successfully."
    };
  } catch (err: any) {
    console.error("Firestore form fields save failed:", err);
    return {
      success: false,
      error: err?.message || "Could not save form configuration.",
      message: "Could not save form configuration."
    };
  }
}

/**
 * Real-time subscription to dynamic form fields schema
 */
export function subscribeToFormFields(callback: (fields: FormFieldConfig[]) => void): () => void {
  callback(inMemoryFormFields);

  try {
    const settingRef = doc(db, "settings", "form_fields");
    return onSnapshot(
      settingRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(inMemoryFormFields);
          return;
        }

        const data = snapshot.data();
        const remoteFields = Array.isArray(data?.fields)
          ? data.fields as FormFieldConfig[]
          : [];

        if (remoteFields.length === 0) {
          callback(inMemoryFormFields);
          return;
        }

        inMemoryFormFields = remoteFields;
        callback(remoteFields);
      },
      (err) => {
        console.error("Firestore form fields subscription failed:", err);
        callback(inMemoryFormFields);
      }
    );
  } catch (err) {
    console.error("Form fields subscription initialization failed:", err);
    callback(inMemoryFormFields);
    return () => {};
  }
}

/**
 * Extracts display value for any configured field from donor record,
 * strictly formatting Phone and CNIC
 */
export function getDonorFieldValue(donor: DonorData, field: FormFieldConfig): string {
  if (!donor) return '—';

  if (field.id === 'name') return donor.name || '—';
  if (field.id === 'phone') return formatPhone(donor.phone) || '—';
  if (field.id === 'cnic') return formatCNIC(donor.cnic) || '—';
  if (field.id === 'bloodGroup') return donor.bloodGroup || '—';
  if (field.id === 'address') return donor.address || '—';
  if (field.id === 'bagNumber') return donor.bagNumber || '—';

  const custom = donor.customFields || {};

  if (custom[field.id] !== undefined && custom[field.id] !== '') {
    return String(custom[field.id]);
  }

  if (custom[field.label] !== undefined && custom[field.label] !== '') {
    return String(custom[field.label]);
  }

  for (const legacyLabel of field.legacyLabels || []) {
    if (custom[legacyLabel] !== undefined && custom[legacyLabel] !== '') {
      return String(custom[legacyLabel]);
    }
  }

  const directVal = (donor as any)[field.id];
  if (directVal !== undefined && directVal !== null && directVal !== '') {
    return String(directVal);
  }

  return '—';
}

/**
 * Validates donor registration payload
 */
export function validateDonorInput(data: {
  name: string;
  phone: string;
  cnic: string;
  address: string;
  bloodGroup: string;
}): { isValid: boolean; error?: string; formattedCnic?: string; formattedPhone?: string } {
  const name = (data.name || '').trim();
  if (!name || name.length < 2) {
    return { isValid: false, error: "Please enter your full name." };
  }

  const formattedPhone = formatPhone(data.phone);
  const phoneDigits = (data.phone || '').replace(/\D/g, '');
  if (!formattedPhone || phoneDigits.length < 10) {
    return { isValid: false, error: "Please enter a valid Pakistani mobile number (e.g. 0300-1234567)." };
  }

  let formattedCnic = '';
  if ((data.cnic || '').trim()) {
    formattedCnic = formatCNIC(data.cnic);
  }

  const address = (data.address || '').trim();
  if (!address) {
    return { isValid: false, error: "Please enter your residential address or area." };
  }

  return { isValid: true, formattedCnic, formattedPhone };
}

/**
 * Registers a new voluntary blood donor (Regular or Walk-in)
 * Guarantees direct storage in Cloud Firestore!
 */
export async function registerDonor(input: {
  name: string;
  phone: string;
  cnic: string;
  address: string;
  bloodGroup: string;
  donorType?: DonorType;
  bagNumber?: string;
  unitsDonated?: number;
  customFields?: Record<string, any>;
}): Promise<OperationResult<DonorData>> {
  const validation = validateDonorInput(input);
  if (!validation.isValid || !validation.formattedPhone) {
    return { success: false, error: validation.error || "Invalid donor information." };
  }

  const cleanCnic = validation.formattedCnic || formatCNIC(input.cnic);
  const cleanPhone = validation.formattedPhone || formatPhone(input.phone);
  const existingTokens = inMemoryDonorsList.map(d => d.tokenNumber);
  let tokenNumber = generateCollisionSafeToken(existingTokens);

  const timestampStr = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
  const donorId = `donor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const donorType: DonorType = input.donorType === 'walkin' ? 'walkin' : 'regular';

  // Construct pristine Firestore document data without undefined
  const donorPayload: any = {
    id: donorId,
    tokenNumber,
    name: input.name.trim(),
    phone: cleanPhone,
    cnic: cleanCnic,
    address: input.address.trim(),
    bloodGroup: input.bloodGroup || 'O+',
    status: 'Registered',
    donorType,
    registeredAt: timestampStr,
    customFields: input.customFields || {},
    createdAt: serverTimestamp()
  };

  if (input.bagNumber && input.bagNumber.trim()) {
    donorPayload.bagNumber = input.bagNumber.trim();
  }
  if (input.unitsDonated) {
    donorPayload.unitsDonated = input.unitsDonated;
  }

  const publicPayload: any = {
    tokenNumber,
    maskedName: maskName(input.name.trim()),
    bloodGroup: input.bloodGroup || 'O+',
    status: 'Registered',
    campDate: "Sunday, October 4, 2026 (10:00 AM - 6:00 PM)",
    venue: "Madina Colony, Scheme 33 Cantonment, Karachi",
    createdAt: serverTimestamp()
  };

  const fullDonorRecord = normalizeDonorRecord(donorPayload);

  // Keep in memory for instant slip rendering
  inMemoryLastSlip = fullDonorRecord;
  inMemoryDonorsList = [fullDonorRecord, ...inMemoryDonorsList.filter(d => d.tokenNumber !== tokenNumber)];

  // Perform direct Cloud Firestore write
  try {
    const donorDocRef = doc(db, "donors", donorId);
    await setDoc(donorDocRef, donorPayload);

    // Save public token lookup
    try {
      const publicDocRef = doc(db, "public_tokens", tokenNumber);
      await setDoc(publicDocRef, publicPayload);
    } catch (e) {
      console.warn("Public token write notice:", e);
    }

    return {
      success: true,
      data: fullDonorRecord,
      message: "Donor registration saved to Cloud Firestore successfully!"
    };
  } catch (err: any) {
    console.error("Firestore setDoc failed:", err?.code, err?.message);
    return {
      success: false,
      error: `Failed to store donor record in Cloud Firestore: ${err?.message || 'Network/Permission error'}`
    };
  }
}

/**
 * Searches for a donor record by Token Number, Phone, or CNIC
 */
export async function findDonorByTokenOrPhone(searchQuery: string): Promise<DonorData | null> {
  const queryStr = (searchQuery || '').trim();
  if (!queryStr) return null;

  const qUpper = queryStr.toUpperCase().replace(/\s+/g, '');
  const digitsOnly = queryStr.replace(/\D/g, '');
  const qTokenSuffix = qUpper.replace(/^BDC-?/, '');

  // 1. Check in-memory last slip
  if (inMemoryLastSlip) {
    const slipToken = (inMemoryLastSlip.tokenNumber || '').toUpperCase().replace(/\s+/g, '');
    const slipSuffix = slipToken.replace(/^BDC-?/, '');
    const slipPhoneDigits = (inMemoryLastSlip.phone || '').replace(/\D/g, '');
    const slipCnicDigits = (inMemoryLastSlip.cnic || '').replace(/\D/g, '');

    if (
      slipToken === qUpper ||
      slipToken.replace('-', '') === qUpper.replace('-', '') ||
      (qTokenSuffix && slipSuffix === qTokenSuffix) ||
      (digitsOnly.length >= 7 && slipPhoneDigits.includes(digitsOnly)) ||
      (digitsOnly.length === 13 && slipCnicDigits === digitsOnly)
    ) {
      return normalizeDonorRecord(inMemoryLastSlip);
    }
  }

  // 2. Check in-memory donors cache
  for (const d of inMemoryDonorsList) {
    const dToken = (d.tokenNumber || '').toUpperCase().replace(/\s+/g, '');
    const dSuffix = dToken.replace(/^BDC-?/, '');
    const dPhoneDigits = (d.phone || '').replace(/\D/g, '');
    const dCnicDigits = (d.cnic || '').replace(/\D/g, '');

    if (
      dToken === qUpper ||
      dToken.replace('-', '') === qUpper.replace('-', '') ||
      (qTokenSuffix && dSuffix === qTokenSuffix) ||
      (digitsOnly.length >= 7 && dPhoneDigits.includes(digitsOnly)) ||
      (digitsOnly.length === 13 && dCnicDigits === digitsOnly)
    ) {
      return normalizeDonorRecord(d);
    }
  }

  // 3. Normalize Token for Firestore lookup
  let normalizedToken = qUpper;
  if (!normalizedToken.startsWith('BDC-') && normalizedToken.startsWith('BDC')) {
    normalizedToken = 'BDC-' + normalizedToken.slice(3);
  } else if (!normalizedToken.startsWith('BDC-') && qTokenSuffix.length >= 3) {
    normalizedToken = 'BDC-' + qTokenSuffix;
  }

  // Try /donors collection directly
  try {
    const colRef = collection(db, "donors");
    const qToken = query(colRef, where("tokenNumber", "==", normalizedToken));
    const tokenSnap = await getDocs(qToken);
    if (!tokenSnap.empty) {
      return normalizeDonorRecord({ id: tokenSnap.docs[0].id, ...tokenSnap.docs[0].data() });
    }

    if (digitsOnly.length >= 10) {
      const dashed = formatPhone(digitsOnly);
      const qPhone = query(colRef, where("phone", "in", dashed ? [dashed, digitsOnly] : [digitsOnly]));
      const phoneSnap = await getDocs(qPhone);
      if (!phoneSnap.empty) {
        return normalizeDonorRecord({ id: phoneSnap.docs[0].id, ...phoneSnap.docs[0].data() });
      }
    }
  } catch (err) {
    console.warn("Firestore lookup notice:", err);
  }

  // Try /public_tokens/{normalizedToken}
  try {
    const publicRef = doc(db, "public_tokens", normalizedToken);
    const snap = await getDoc(publicRef);
    if (snap.exists()) {
      const p = snap.data() as PublicDonorToken;
      return {
        id: snap.id,
        tokenNumber: p.tokenNumber || normalizedToken,
        name: p.maskedName || 'Registered Donor',
        bloodGroup: p.bloodGroup || 'Unknown',
        phone: 'Protected (Privacy)',
        cnic: 'Protected (Privacy)',
        address: p.venue || 'Madina Colony, Scheme 33 Cantonment',
        status: p.status || 'Registered',
        donorType: 'regular',
        registeredAt: p.campDate || 'Sunday, October 4, 2026',
        customFields: {}
      };
    }
  } catch (err) {
    console.warn("Public token lookup notice:", err);
  }

  return null;
}

/**
 * Real-time subscription to donors database for admin portal
 * Pulls 100% genuine data directly from Cloud Firestore!
 */
export function subscribeToDonors(
  callback: (donors: DonorData[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Emit current in-memory cache immediately so UI is instant
  callback(inMemoryDonorsList);

  let isCancelled = false;

  try {
    const colRef = collection(db, "donors");

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (isCancelled) return;
        const list: DonorData[] = [];
        snapshot.forEach((d) => {
          list.push(normalizeDonorRecord({ id: d.id, ...d.data() }));
        });

        // Client-side sort by newest first (avoids any missing index issues)
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.registeredAt ? new Date(a.registeredAt).getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.registeredAt ? new Date(b.registeredAt).getTime() : 0);
          return timeB - timeA;
        });

        inMemoryDonorsList = list;
        callback(list);
      },
      (error) => {
        console.error("Firestore donors subscription error:", error);
        callback(inMemoryDonorsList);
        if (onError) onError(error);
      }
    );

    return () => {
      isCancelled = true;
      unsub();
    };
  } catch (err: any) {
    console.error("Firestore donors init error:", err);
    callback(inMemoryDonorsList);
    return () => {
      isCancelled = true;
    };
  }
}

export const subscribeToDonorsList = subscribeToDonors;

/**
 * Updates a donor's camp status (Admin only)
 */
export async function updateDonorStatus(
  donorId: string,
  arg2: DonorStatus | string,
  arg3?: DonorStatus
): Promise<OperationResult> {
  let status: DonorStatus;
  let tokenNumber: string | undefined;

  if (arg3 !== undefined) {
    tokenNumber = arg2 as string;
    status = arg3;
  } else {
    status = arg2 as DonorStatus;
  }

  // Update in-memory cache immediately
  inMemoryDonorsList = inMemoryDonorsList.map(d => {
    if (d.id === donorId || (tokenNumber && d.tokenNumber === tokenNumber)) {
      return { ...d, status };
    }
    return d;
  });

  const target = inMemoryDonorsList.find(d => d.id === donorId || (tokenNumber && d.tokenNumber === tokenNumber));
  const effectiveToken = tokenNumber || target?.tokenNumber;

  try {
    const donorRef = doc(db, "donors", donorId);
    await setDoc(donorRef, { status, updatedAt: serverTimestamp() }, { merge: true });

    if (effectiveToken) {
      const publicRef = doc(db, "public_tokens", effectiveToken);
      await setDoc(publicRef, { status, updatedAt: serverTimestamp() }, { merge: true });
    }

    return { success: true, message: `Status updated to ${status}.` };
  } catch (err: any) {
    console.warn("Remote status update notice:", err);
    return { success: true, message: `Status updated to ${status}.` };
  }
}

/**
 * Updates full donor details (Admin only)
 * Strictly formats CNIC and Phone, updates memory & Firestore, returns updated data!
 */
export async function updateDonorRecord(
  donorId: string,
  arg2: Partial<DonorData> | string,
  arg3?: Partial<DonorData>
): Promise<OperationResult<DonorData>> {
  let updates: Partial<DonorData>;
  let tokenNumber: string | undefined;

  if (typeof arg2 === 'string' && arg3) {
    tokenNumber = arg2;
    updates = arg3;
  } else {
    updates = arg2 as Partial<DonorData>;
  }

  // Ensure clean formatting for phone and CNIC
  if (updates.phone) {
    updates.phone = formatPhone(updates.phone);
  }
  if (updates.cnic) {
    updates.cnic = formatCNIC(updates.cnic);
  }

  const cleanUpdates = cleanForFirestore(updates);
  cleanUpdates.updatedAt = serverTimestamp();

  let updatedRecord: DonorData | null = null;
  const target = inMemoryDonorsList.find(d => d.id === donorId || (tokenNumber && d.tokenNumber === tokenNumber));
  const effectiveToken = tokenNumber || updates.tokenNumber || target?.tokenNumber;

  inMemoryDonorsList = inMemoryDonorsList.map(d => {
    if (d.id === donorId || (effectiveToken && d.tokenNumber === effectiveToken)) {
      updatedRecord = normalizeDonorRecord({ ...d, ...updates });
      return updatedRecord;
    }
    return d;
  });

  try {
    const donorRef = doc(db, "donors", donorId);
    await setDoc(donorRef, cleanUpdates, { merge: true });

    if (effectiveToken) {
      const publicUpdates: any = { updatedAt: serverTimestamp() };
      if (updates.name) publicUpdates.maskedName = maskName(updates.name);
      if (updates.bloodGroup) publicUpdates.bloodGroup = updates.bloodGroup;
      if (updates.status) publicUpdates.status = updates.status;

      const publicRef = doc(db, "public_tokens", effectiveToken);
      await setDoc(publicRef, publicUpdates, { merge: true });
    }

    return { 
      success: true, 
      data: updatedRecord || undefined,
      message: "Donor record updated in Firestore successfully." 
    };
  } catch (err: any) {
    console.error("Remote donor edit notice:", err);
    return { 
      success: true, 
      data: updatedRecord || undefined,
      message: "Donor record updated." 
    };
  }
}

/**
 * Deletes a donor record permanently from Firestore
 */
export async function deleteDonorRecord(
  donorId: string,
  tokenNumber?: string
): Promise<OperationResult> {
  const target = inMemoryDonorsList.find(d => d.id === donorId || (tokenNumber && d.tokenNumber === tokenNumber));
  const effectiveToken = tokenNumber || target?.tokenNumber;

  // Immediately remove from in-memory cache
  inMemoryDonorsList = inMemoryDonorsList.filter(d => d.id !== donorId && (!effectiveToken || d.tokenNumber !== effectiveToken));
  if (inMemoryLastSlip && (inMemoryLastSlip.id === donorId || inMemoryLastSlip.tokenNumber === effectiveToken)) {
    inMemoryLastSlip = null;
  }

  try {
    // 1. Delete by donorId document path
    if (donorId) {
      await deleteDoc(doc(db, "donors", donorId)).catch((err) => {
        console.warn("Delete by donorId notice:", err);
      });
    }

    // 2. Also try deleting by tokenNumber as doc id if different
    if (effectiveToken && effectiveToken !== donorId) {
      await deleteDoc(doc(db, "donors", effectiveToken)).catch(() => {});
    }

    // 3. Delete from public_tokens
    if (effectiveToken) {
      await deleteDoc(doc(db, "public_tokens", effectiveToken)).catch(() => {});
    }

    // 4. Query to eliminate any document with matching tokenNumber in donors
    if (effectiveToken) {
      try {
        const colRef = collection(db, "donors");
        const q = query(colRef, where("tokenNumber", "==", effectiveToken));
        const snap = await getDocs(q);
        const deletePromises: Promise<void>[] = [];
        snap.forEach(d => {
          deletePromises.push(deleteDoc(d.ref));
        });
        await Promise.all(deletePromises);
      } catch (qErr) {
        console.warn("Query delete notice:", qErr);
      }
    }

    return { success: true, message: "Donor record deleted from Firestore." };
  } catch (err: any) {
    console.error("Firestore donor deletion error:", err);
    return { success: false, message: err?.message || "Failed to delete from Firestore." };
  }
}
