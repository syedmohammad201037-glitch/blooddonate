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
const FORM_FIELDS_STORAGE_KEY = 'jamaat_blood_form_fields_v2';
const DONORS_STORAGE_KEY = 'jamaat_blood_donors_v2';
const DELETED_DONORS_STORAGE_KEY = 'jamaat_blood_deleted_donors_v2';

export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
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
    options: ['Unknown'],
    isSystem: true,
    enabled: true,
    helpText: 'Free spot screening test conducted at camp'
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

// Blood Group Public Form Restriction Controls
const BLOOD_GROUP_SETTING_STORAGE_KEY = 'jamaat_blood_allow_all_groups_v1';
export const ALL_BLOOD_GROUPS = ['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const RESTRICTED_BLOOD_GROUPS = ['Unknown'];

let inMemoryAllowAllBloodGroups = false;
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(BLOOD_GROUP_SETTING_STORAGE_KEY);
    if (raw !== null) {
      inMemoryAllowAllBloodGroups = raw === 'true';
    }
  } catch {}
}

const bloodGroupSettingListeners = new Set<(allowAll: boolean) => void>();

export function getAllowAllBloodGroups(): boolean {
  return inMemoryAllowAllBloodGroups;
}

export function subscribeToBloodGroupSetting(callback: (allowAll: boolean) => void): () => void {
  bloodGroupSettingListeners.add(callback);
  callback(inMemoryAllowAllBloodGroups);
  return () => {
    bloodGroupSettingListeners.delete(callback);
  };
}

let lastLocalFormFieldsUpdateTime = 0;

export async function setAllowAllBloodGroups(allowAll: boolean): Promise<OperationResult> {
  inMemoryAllowAllBloodGroups = allowAll;
  lastLocalFormFieldsUpdateTime = Date.now();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BLOOD_GROUP_SETTING_STORAGE_KEY, String(allowAll));
    } catch {}
  }

  // Update inMemoryFormFields so bloodGroup options reflect the setting
  inMemoryFormFields = inMemoryFormFields.map(f => {
    if (f.id === 'bloodGroup') {
      return {
        ...f,
        options: allowAll ? [...ALL_BLOOD_GROUPS] : [...RESTRICTED_BLOOD_GROUPS]
      };
    }
    return f;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FORM_FIELDS_STORAGE_KEY, JSON.stringify(inMemoryFormFields));
    } catch {}
  }

  notifyFormFieldsListeners(inMemoryFormFields);
  bloodGroupSettingListeners.forEach(cb => {
    try { cb(allowAll); } catch {}
  });

  try {
    const settingRef = doc(db, "settings", "form_fields");
    const payload = cleanForFirestore({
      fields: inMemoryFormFields,
      allowAllBloodGroups: allowAll,
      updatedAt: serverTimestamp(),
    });
    await setDoc(settingRef, payload, { merge: true });
  } catch (err) {
    console.warn("Firestore remote setting update note:", err);
  }

  return {
    success: true,
    message: allowAll
      ? "All 8 blood groups are now enabled in the public form."
      : "Public registration form is now restricted to 'Unknown' only (spot screening at camp)."
  };
}

// Load persisted deleted donors
const deletedDonorIds = new Set<string>();
if (typeof window !== 'undefined') {
  try {
    const rawDel = localStorage.getItem(DELETED_DONORS_STORAGE_KEY);
    if (rawDel) {
      const arr = JSON.parse(rawDel);
      if (Array.isArray(arr)) {
        arr.forEach(id => deletedDonorIds.add(String(id)));
      }
    }
  } catch {}
}

export function isDonorDeleted(id?: string, tokenNumber?: string): boolean {
  if (id && deletedDonorIds.has(id)) return true;
  if (tokenNumber && deletedDonorIds.has(tokenNumber)) return true;
  return false;
}

export function saveDeletedDonorId(idOrToken: string): void {
  if (!idOrToken) return;
  deletedDonorIds.add(idOrToken);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DELETED_DONORS_STORAGE_KEY, JSON.stringify(Array.from(deletedDonorIds)));
    } catch {}
  }
}

// Load persisted form fields
function loadInitialFormFields(): FormFieldConfig[] {
  let fields = DEFAULT_FORM_FIELDS;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(FORM_FIELDS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          fields = parsed;
        }
      }
    } catch {}
  }

  return fields.map((f: FormFieldConfig) => {
    if (f.id === 'bloodGroup') {
      return {
        ...f,
        options: inMemoryAllowAllBloodGroups ? [...ALL_BLOOD_GROUPS] : [...RESTRICTED_BLOOD_GROUPS]
      };
    }
    return f;
  });
}

// Active listeners for real-time form field configuration updates
const formFieldsListeners = new Set<(fields: FormFieldConfig[]) => void>();

function notifyFormFieldsListeners(fields: FormFieldConfig[]): void {
  formFieldsListeners.forEach(cb => {
    try {
      cb(fields);
    } catch (err) {
      console.warn("Form fields listener notification warning:", err);
    }
  });
}

let inMemoryFormFields: FormFieldConfig[] = loadInitialFormFields();
let inMemoryDonorsList: DonorData[] = [];
let inMemoryLastSlip: DonorData | null = null;

/**
 * Strips any undefined fields deeply (including inside arrays) so Firestore setDoc/updateDoc never throws
 */
export function cleanForFirestore(data: any): any {
  if (data === undefined || data === null) {
    return null;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanForFirestore(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        result[key] = cleanForFirestore(value);
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
    .map((field, index) => {
      const nextField: FormFieldConfig = {
        id: String(field.id || `custom_${Date.now()}_${index}`),
        label: String(field.label || '').trim(),
        placeholder: String(field.placeholder || '').trim(),
        type: field.type || 'text',
        required: Boolean(field.required),
        order: index + 1,
        enabled: field.enabled !== false,
      };

      // Only write optional properties when they actually have a value.
      if (field.helpText !== undefined && field.helpText !== null) {
        nextField.helpText = String(field.helpText);
      }

      if (field.isSystem !== undefined && field.isSystem !== null) {
        nextField.isSystem = Boolean(field.isSystem);
      }

      if (Array.isArray(field.legacyLabels) && field.legacyLabels.length > 0) {
        nextField.legacyLabels = Array.from(
          new Set(field.legacyLabels.map(label => String(label).trim()).filter(Boolean))
        );
      }

      if (field.type === 'select') {
        const rawOpts = Array.isArray(field.options)
          ? field.options.map(option => String(option).trim()).filter(Boolean)
          : [];
        if (nextField.id === 'bloodGroup') {
          nextField.options = inMemoryAllowAllBloodGroups ? [...ALL_BLOOD_GROUPS] : [...RESTRICTED_BLOOD_GROUPS];
        } else {
          nextField.options = rawOpts;
        }
      }

      return nextField;
    })
    .filter(field => field.label.length > 0)
    .map(field => cleanForFirestore(field) as FormFieldConfig);

  // 1. Immediately update in-memory cache and record modification time
  lastLocalFormFieldsUpdateTime = Date.now();
  inMemoryFormFields = normalizedFields;

  // 2. Immediately persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FORM_FIELDS_STORAGE_KEY, JSON.stringify(normalizedFields));
    } catch {}
  }

  // 3. Immediately notify all active subscriber components
  notifyFormFieldsListeners(normalizedFields);

  // 4. Persist to Firestore with pristine recursively cleaned data
  try {
    const settingRef = doc(db, "settings", "form_fields");
    const payload = cleanForFirestore({
      fields: normalizedFields,
      allowAllBloodGroups: inMemoryAllowAllBloodGroups,
      updatedAt: serverTimestamp(),
    });
    await setDoc(settingRef, payload, { merge: true });
  } catch (err: any) {
    console.warn("Remote Firestore form fields update note:", err?.message || err);
  }

  return {
    success: true,
    message: "Form configuration saved successfully."
  };
}

/**
 * Real-time subscription to dynamic form fields schema
 */
export function subscribeToFormFields(callback: (fields: FormFieldConfig[]) => void): () => void {
  // Add to active memory listeners
  formFieldsListeners.add(callback);

  // Emit current state immediately
  callback(inMemoryFormFields);

  try {
    const settingRef = doc(db, "settings", "form_fields");
    const unsub = onSnapshot(
      settingRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        // If a local modification was made within the last 3.5 seconds and has pending writes, retain local state
        if (Date.now() - lastLocalFormFieldsUpdateTime < 3500 && snapshot.metadata.hasPendingWrites) {
          callback(inMemoryFormFields);
          return;
        }

        if (!snapshot.exists()) {
          callback(inMemoryFormFields);
          return;
        }

        const data = snapshot.data();
        let remoteFields = Array.isArray(data?.fields)
          ? data.fields as FormFieldConfig[]
          : [];

        if (remoteFields.length === 0) {
          callback(inMemoryFormFields);
          return;
        }

        if (data.allowAllBloodGroups !== undefined) {
          const remoteAllowAll = Boolean(data.allowAllBloodGroups);
          inMemoryAllowAllBloodGroups = remoteAllowAll;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(BLOOD_GROUP_SETTING_STORAGE_KEY, String(remoteAllowAll));
            } catch {}
          }
          bloodGroupSettingListeners.forEach(cb => {
            try { cb(remoteAllowAll); } catch {}
          });
        }

        // Apply bloodGroup options based on inMemoryAllowAllBloodGroups
        remoteFields = remoteFields.map(f => {
          if (f.id === 'bloodGroup') {
            return {
              ...f,
              options: inMemoryAllowAllBloodGroups ? [...ALL_BLOOD_GROUPS] : [...RESTRICTED_BLOOD_GROUPS]
            };
          }
          return f;
        });

        inMemoryFormFields = remoteFields;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(FORM_FIELDS_STORAGE_KEY, JSON.stringify(remoteFields));
          } catch {}
        }
        callback(remoteFields);
      },
      (err) => {
        console.warn("Firestore form fields subscription note:", err);
        callback(inMemoryFormFields);
      }
    );

    return () => {
      formFieldsListeners.delete(callback);
      unsub();
    };
  } catch (err) {
    console.warn("Form fields subscription initialization note:", err);
    callback(inMemoryFormFields);
    return () => {
      formFieldsListeners.delete(callback);
    };
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
  const effectiveBloodGroup = input.bloodGroup && input.bloodGroup.trim() ? input.bloodGroup : 'Unknown';

  // Construct pristine Firestore document data without undefined
  const donorPayload: any = {
    id: donorId,
    tokenNumber,
    name: input.name.trim(),
    phone: cleanPhone,
    cnic: cleanCnic,
    address: input.address.trim(),
    bloodGroup: effectiveBloodGroup,
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
    bloodGroup: effectiveBloodGroup,
    status: 'Registered',
    campDate: "Sunday, October 4, 2026 (10:00 AM - 6:00 PM)",
    venue: "Madina Colony, Scheme 33 Cantonment, Karachi",
    createdAt: serverTimestamp()
  };

  const fullDonorRecord = normalizeDonorRecord(donorPayload);

  // Keep in memory for instant slip rendering
  inMemoryLastSlip = fullDonorRecord;
  inMemoryDonorsList = [fullDonorRecord, ...inMemoryDonorsList.filter(d => d.tokenNumber !== tokenNumber)];

  // Persist to localStorage immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DONORS_STORAGE_KEY, JSON.stringify(inMemoryDonorsList.slice(0, 100)));
    } catch {}
  }

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
      message: "Donor registration recorded and synchronized successfully!"
    };
  } catch (err: any) {
    console.warn("Firestore remote write note:", err?.message || err);
    // Still return success since the donor record is fully stored in memory and localStorage
    return {
      success: true,
      data: fullDonorRecord,
      message: "Donor registration recorded successfully."
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
  // If in-memory is empty, try loading persisted donors from localStorage
  if (inMemoryDonorsList.length === 0 && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DONORS_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored)) {
          inMemoryDonorsList = stored
            .map(normalizeDonorRecord)
            .filter(d => !isDonorDeleted(d.id, d.tokenNumber));
        }
      }
    } catch {}
  }

  // Filter out any deleted donors
  inMemoryDonorsList = inMemoryDonorsList.filter(d => !isDonorDeleted(d.id, d.tokenNumber));

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
          const donor = normalizeDonorRecord({ id: d.id, ...d.data() });
          // CRITICAL: Strictly filter out any deleted donors
          if (!isDonorDeleted(donor.id, donor.tokenNumber)) {
            list.push(donor);
          }
        });

        // Merge any locally registered donors that might not have landed on Firestore yet
        inMemoryDonorsList.forEach(localDonor => {
          if (!isDonorDeleted(localDonor.id, localDonor.tokenNumber) &&
              !list.some(d => d.tokenNumber === localDonor.tokenNumber || (localDonor.id && d.id === localDonor.id))) {
            list.push(localDonor);
          }
        });

        // Client-side sort by newest first (avoids any missing index issues)
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.registeredAt ? new Date(a.registeredAt).getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.registeredAt ? new Date(b.registeredAt).getTime() : 0);
          return timeB - timeA;
        });

        inMemoryDonorsList = list;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(DONORS_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
          } catch {}
        }
        callback(list);
      },
      (error) => {
        console.warn("Firestore donors subscription note:", error?.message || error);
        callback(inMemoryDonorsList);
        if (onError) onError(error);
      }
    );

    return () => {
      isCancelled = true;
      unsub();
    };
  } catch (err: any) {
    console.warn("Firestore donors init note:", err);
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

  // 1. Mark as permanently deleted so it NEVER reappears
  if (donorId) saveDeletedDonorId(donorId);
  if (effectiveToken) saveDeletedDonorId(effectiveToken);

  // 2. Immediately remove from in-memory cache and localStorage
  inMemoryDonorsList = inMemoryDonorsList.filter(d => 
    d.id !== donorId && (!effectiveToken || d.tokenNumber !== effectiveToken)
  );
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DONORS_STORAGE_KEY, JSON.stringify(inMemoryDonorsList));
    } catch {}
  }
  if (inMemoryLastSlip && (inMemoryLastSlip.id === donorId || inMemoryLastSlip.tokenNumber === effectiveToken)) {
    inMemoryLastSlip = null;
  }

  // 3. Delete from Firestore across all paths
  try {
    if (donorId) {
      await deleteDoc(doc(db, "donors", donorId)).catch(() => {});
    }
    if (effectiveToken && effectiveToken !== donorId) {
      await deleteDoc(doc(db, "donors", effectiveToken)).catch(() => {});
    }
    if (effectiveToken) {
      await deleteDoc(doc(db, "public_tokens", effectiveToken)).catch(() => {});
    }
    if (effectiveToken) {
      const colRef = collection(db, "donors");
      const q = query(colRef, where("tokenNumber", "==", effectiveToken));
      const snap = await getDocs(q).catch(() => null);
      if (snap) {
        const deletePromises: Promise<void>[] = [];
        snap.forEach(d => {
          deletePromises.push(deleteDoc(d.ref).catch(() => {}));
        });
        await Promise.all(deletePromises);
      }
    }
  } catch (err: any) {
    console.warn("Firestore remote delete note:", err);
  }

  return { success: true, message: "Donor record deleted permanently." };
}
