import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, 
  Search, 
  Download, 
  Printer, 
  Phone, 
  LogOut, 
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  MessageSquare,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  X,
  Sliders,
  Users,
  Eye,
  RotateCcw,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Calendar,
  FileCheck
} from 'lucide-react';
import { 
  subscribeToDonors, 
  updateDonorStatus, 
  updateDonorRecord,
  deleteDonorRecord, 
  DonorData,
  FormFieldConfig,
  getFormFieldsConfig,
  saveFormFieldsConfig,
  subscribeToFormFields,
  DEFAULT_FORM_FIELDS,
  registerDonor,
  getDonorFieldValue
} from '../lib/firebase';
import { 
  formatCNIC, 
  formatPhone, 
  formatDate, 
  getWhatsAppUrl 
} from '../utils/formatters';
import { 
  loginAdmin, 
  registerAdmin, 
  loginWithGoogle,
  logoutAdmin, 
  getStoredAdminSession, 
  AdminUser 
} from '../lib/adminAuth';

interface AdminPortalProps {
  onBackToLanding: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToLanding }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(getStoredAdminSession());
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Navigation Tabs: 'donors' (All) | 'walkin' (Dedicated Walk-in List) | 'regular' (Online List) | 'form-builder'
  const [adminTab, setAdminTab] = useState<'donors' | 'walkin' | 'regular' | 'form-builder'>('donors');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasskey, setRegPasskey] = useState('');
  
  // Feedback
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateNotification, setUpdateNotification] = useState<string | null>(null);
  
  // Donors data & filters
  const [donors, setDonors] = useState<DonorData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Form Fields Configuration State (Subscribed in real time)
  const [formFields, setFormFields] = useState<FormFieldConfig[]>(getFormFieldsConfig());
  const [isSavingFormConfig, setIsSavingFormConfig] = useState(false);
  const [formConfigSuccess, setFormConfigSuccess] = useState<string | null>(null);

  // New / Edit Field Modal State
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'tel' | 'number' | 'select' | 'textarea'>('text');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState('');

  // Dynamic Walk-In Donor Modal State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInValues, setWalkInValues] = useState<Record<string, string>>({
    name: '',
    phone: '',
    cnic: '',
    bloodGroup: 'O+',
    address: 'Scheme 33 Camp Walk-in',
    bagNumber: ''
  });

  // Dynamic Edit Donor Record Modal State
  const [editingDonor, setEditingDonor] = useState<DonorData | null>(null);
  const [editDonorValues, setEditDonorValues] = useState<Record<string, string>>({});
  const [editDonorStatus, setEditDonorStatus] = useState<DonorData['status']>('Registered');
  const [editDonorType, setEditDonorType] = useState<'regular' | 'walkin'>('regular');

  // Print Slip Modal State
  const [slipModalDonor, setSlipModalDonor] = useState<DonorData | null>(null);

  // In-App Delete Confirmation Modal State (replaces window.confirm)
  const [donorToDelete, setDonorToDelete] = useState<DonorData | null>(null);

  // Real-time synchronization for donors database and form configuration
  useEffect(() => {
    const unsubDonors = subscribeToDonors((data) => {
      setDonors(data);
    });
    const unsubFields = subscribeToFormFields((fields) => {
      const active = fields
        .filter(f => f.enabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setFormFields(active.length > 0 ? active : DEFAULT_FORM_FIELDS);
    });
    return () => {
      unsubDonors();
      unsubFields();
    };
  }, []);

  // Quick 1-click coordinator access for live camp desk
  const handleQuickAccess = () => {
    const coordinatorUser: AdminUser = {
      uid: 'coordinator_scheme33_camp',
      email: 'coordinator@scheme33cantonment.org',
      displayName: 'Camp Coordinator',
      role: 'superadmin'
    };
    setCurrentUser(coordinatorUser);
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await loginAdmin(loginEmail, loginPassword);
      if (res.success && res.user) {
        setCurrentUser(res.user);
      } else {
        setAuthError(res.message);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.success && res.user) {
        setCurrentUser(res.user);
      } else {
        setAuthError(res.message);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Google sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerAdmin(
        regEmail,
        regPassword,
        regName,
        regPasskey
      );

      if (res.success && res.user) {
        setCurrentUser(res.user);
      } else {
        setAuthError(res.message);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setCurrentUser(null);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/admin`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleStatusChange = async (id: string, status: DonorData['status']) => {
    // Immediately update UI
    setDonors(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    setUpdateNotification(`Status updated to ${status}.`);
    setTimeout(() => setUpdateNotification(null), 3000);

    await updateDonorStatus(id, status);
  };

  const confirmDeleteDonor = async (donor: DonorData) => {
    setDonorToDelete(null);
    if (!donor) return;
    const targetId = donor.id || donor.tokenNumber;

    // Immediately remove from UI state
    setDonors(prev => prev.filter(d => d.id !== targetId && d.tokenNumber !== donor.tokenNumber));
    setUpdateNotification(`Donor ${donor.name} (${donor.tokenNumber}) removed.`);
    setTimeout(() => setUpdateNotification(null), 3000);

    // Delete permanently from Cloud Firestore
    await deleteDonorRecord(targetId, donor.tokenNumber);
  };

  // Dedicated Print Slip
  const handlePrintSlip = (donorToPrint: DonorData) => {
    const formattedCnic = formatCNIC(donorToPrint.cnic);
    const formattedPhoneNum = formatPhone(donorToPrint.phone);

    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Donor Slip - ${donorToPrint.tokenNumber}</title>
            <style>
              body { font-family: 'Open Sans', system-ui, sans-serif; padding: 24px; color: #1a202c; margin: 0; }
              .header { text-align: center; border-bottom: 2px solid #ea3a3c; padding-bottom: 12px; margin-bottom: 16px; }
              .token-box { background: #fef2f2; border: 1px solid #fecaca; padding: 14px; text-align: center; margin-bottom: 16px; border-radius: 6px; }
              .token-num { font-size: 28px; font-weight: bold; color: #991b1b; font-family: monospace; letter-spacing: 1px; }
              .badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: bold; border-radius: 12px; background: #fee2e2; color: #991b1b; margin-top: 6px; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
              td.label { color: #64748b; font-weight: 600; width: 35%; }
              td.val { font-weight: bold; color: #0f172a; word-break: break-word; font-family: monospace; font-size: 14px; }
              td.val-norm { font-weight: bold; color: #0f172a; word-break: break-word; font-size: 14px; }
              .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; font-size: 12px; border-radius: 4px; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin:0; color:#ea3a3c;">BLOOD DONATION CAMP 2026</h2>
              <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Jamaat-e-Islami, Madina Colony Ward 10 & Scheme 33 Cantonment</p>
            </div>
            <div class="token-box">
              <div style="font-size:11px; text-transform:uppercase; color:#ea3a3c; font-weight:bold;">
                ${donorToPrint.donorType === 'walkin' ? 'WALK-IN RECEPTION ENTRY TOKEN' : 'ONLINE REGISTERED DONOR TOKEN'}
              </div>
              <div class="token-num">${donorToPrint.tokenNumber}</div>
              <div class="badge">Status: ${donorToPrint.status || 'Registered'}</div>
            </div>
            <table>
              <tr><td class="label">Donor Name:</td><td class="val-norm">${donorToPrint.name}</td></tr>
              <tr><td class="label">Donor Category:</td><td class="val-norm">${donorToPrint.donorType === 'walkin' ? 'Walk-in (On-Site Desk)' : 'Regular / Online Pre-Registration'}</td></tr>
              <tr><td class="label">Blood Group:</td><td class="val-norm" style="color:#ea3a3c; font-size:16px;">${donorToPrint.bloodGroup}</td></tr>
              <tr><td class="label">Contact Phone:</td><td class="val">${formattedPhoneNum}</td></tr>
              <tr><td class="label">CNIC Number:</td><td class="val">${formattedCnic}</td></tr>
              ${donorToPrint.bagNumber ? `<tr><td class="label">Bag Number:</td><td class="val">${donorToPrint.bagNumber}</td></tr>` : ''}
              <tr><td class="label">Address / Area:</td><td class="val-norm">${donorToPrint.address}</td></tr>
              <tr><td class="label">Camp Date:</td><td class="val-norm">Sunday, October 4, 2026 (10:00 AM - 6:00 PM)</td></tr>
              <tr><td class="label">Venue:</td><td class="val-norm">Madina Colony, Scheme 33 Cantonment, Karachi</td></tr>
            </table>
            <div class="info-box">
              <strong>Camp Instructions:</strong> Present this slip to the medical staff at blood collection station. Verified donor details with Pakistan CNIC record.
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 350);
    } else {
      window.print();
    }
  };

  // CSV Export with formatted CNIC and Phone
  const handleExportCSV = (listToExport: DonorData[], filenamePrefix: string) => {
    if (listToExport.length === 0) {
      alert("No donor data to export in current view.");
      return;
    }

    const headers = [
      "Token ID",
      "Donor Type",
      "Full Name",
      "Phone (Formatted)",
      "CNIC (Formatted)",
      "Blood Group",
      "Address",
      "Bag Number",
      "Status",
      "Registered At"
    ];

    const rows = listToExport.map(d => {
      return [
        `"${d.tokenNumber || ''}"`,
        `"${d.donorType === 'walkin' ? 'Walk-in' : 'Regular'}"`,
        `"${(d.name || '').replace(/"/g, '""')}"`,
        `"${formatPhone(d.phone)}"`,
        `"${formatCNIC(d.cnic)}"`,
        `"${d.bloodGroup || 'Unknown'}"`,
        `"${(d.address || '').replace(/"/g, '""')}"`,
        `"${d.bagNumber || ''}"`,
        `"${d.status || 'Registered'}"`,
        `"${d.registeredAt || ''}"`
      ];
    });

    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${filenamePrefix}_Scheme33_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // FORM BUILDER CONTROLS
  // -------------------------------------------------------------
  const openAddFieldModal = () => {
    setEditingField(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldPlaceholder('');
    setFieldRequired(false);
    setFieldOptions('');
    setIsFieldModalOpen(true);
  };

  const openEditFieldModal = (field: FormFieldConfig) => {
    setEditingField(field);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldPlaceholder(field.placeholder);
    setFieldRequired(field.required);
    setFieldOptions(field.options ? field.options.join(', ') : '');
    setIsFieldModalOpen(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) return;

    let updatedList = [...formFields];

    if (editingField) {
      updatedList = updatedList.map(f => {
        if (f.id === editingField.id) {
          const nextLabel = fieldLabel.trim();
          const previousLabels = Array.isArray(f.legacyLabels) ? f.legacyLabels : [];
          const legacyLabels =
            f.label && f.label !== nextLabel
              ? Array.from(new Set([...previousLabels, f.label]))
              : previousLabels;

          return {
            ...f,
            label: nextLabel,
            type: fieldType,
            placeholder: fieldPlaceholder.trim() || `Enter ${nextLabel}`,
            required: fieldRequired,
            options: fieldType === 'select'
              ? fieldOptions.split(',').map(s => s.trim()).filter(Boolean)
              : undefined,
            legacyLabels
          };
        }
        return f;
      });
    } else {
      const newId = `custom_${Date.now()}`;
      const newField: FormFieldConfig = {
        id: newId,
        label: fieldLabel.trim(),
        type: fieldType,
        placeholder: fieldPlaceholder.trim() || `Enter ${fieldLabel.trim()}`,
        required: fieldRequired,
        order: updatedList.length + 1,
        enabled: true,
        options: fieldType === 'select' 
          ? fieldOptions.split(',').map(s => s.trim()).filter(Boolean)
          : undefined
      };
      updatedList.push(newField);
    }

    const saved = await saveFormConfig(updatedList);
    if (saved) {
      setIsFieldModalOpen(false);
      setEditingField(null);
    }
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formFields.length) return;

    const newList = [...formFields];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    const reordered = newList.map((item, idx) => ({ ...item, order: idx + 1 }));
    setFormFields(reordered);
    await saveFormConfig(reordered);
  };

  const handleDeleteField = async (fieldId: string) => {
    const newList = formFields.filter(f => f.id !== fieldId).map((f, idx) => ({ ...f, order: idx + 1 }));
    setFormFields(newList);
    setUpdateNotification("Field removed.");
    setTimeout(() => setUpdateNotification(null), 2500);
    await saveFormConfig(newList);
  };

  const handleResetFormFields = async () => {
    setFormFields(DEFAULT_FORM_FIELDS);
    setUpdateNotification("Reset form to default fields.");
    setTimeout(() => setUpdateNotification(null), 2500);
    await saveFormConfig(DEFAULT_FORM_FIELDS);
  };

  const saveFormConfig = async (fieldsToSave: FormFieldConfig[]) => {
    setIsSavingFormConfig(true);
    setFormConfigSuccess(null);

    try {
      const result = await saveFormFieldsConfig(fieldsToSave);

      if (!result.success) {
        throw new Error(result.error || result.message || 'Could not save form configuration.');
      }

      const savedFields = fieldsToSave.map((field, index) => ({
        ...field,
        order: index + 1,
        enabled: field.enabled !== false
      }));

      setFormFields(savedFields);
      setFormConfigSuccess("Form updated and synchronized with database.");
      setUpdateNotification("Form fields saved successfully. Public registration form is now synchronized.");
      setTimeout(() => setFormConfigSuccess(null), 3500);
      setTimeout(() => setUpdateNotification(null), 4000);
      return true;
    } catch (err: any) {
      console.error("Form configuration save failed:", err);
      setFormConfigSuccess(`Save failed: ${err?.message || 'Could not save form configuration.'}`);
      return false;
    } finally {
      setIsSavingFormConfig(false);
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC WALK-IN DONOR REGISTRATION (RECEPTION DESK)
  // -------------------------------------------------------------
  const openWalkInModal = () => {
    const initialVals: Record<string, string> = {
      name: '',
      phone: '',
      cnic: '',
      bloodGroup: 'O+',
      address: 'Scheme 33 Camp Walk-in',
      bagNumber: ''
    };
    formFields.forEach(f => {
      if (!['name', 'phone', 'cnic', 'address', 'bloodGroup'].includes(f.id)) {
        if (f.type === 'select' && f.options && f.options.length > 0) {
          initialVals[f.id] = f.options[0];
        } else {
          initialVals[f.id] = '';
        }
      }
    });
    setWalkInValues(initialVals);
    setIsWalkInModalOpen(true);
  };

  const handleSaveWalkInDonor = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = (walkInValues['name'] || '').trim();
    const phone = formatPhone(walkInValues['phone'] || '');
    const cnic = formatCNIC(walkInValues['cnic'] || '');
    const address = (walkInValues['address'] || 'Scheme 33 Camp Walk-in').trim();
    const bloodGroup = walkInValues['bloodGroup'] || 'O+';
    const bagNumber = (walkInValues['bagNumber'] || '').trim();

    if (!name) {
      alert("Please provide the donor's full name.");
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      alert("Please provide a valid 11-digit mobile number (e.g. 0300-1234567).");
      return;
    }

    const customFields: Record<string, any> = {};
    formFields.forEach(f => {
      if (!['name', 'phone', 'cnic', 'address', 'bloodGroup', 'bagNumber'].includes(f.id)) {
        customFields[f.id] = walkInValues[f.id] || '';
        customFields[f.label] = walkInValues[f.id] || '';
      }
    });

    setIsSubmitting(true);
    try {
      const res = await registerDonor({
        name,
        phone,
        cnic,
        address,
        bloodGroup,
        donorType: 'walkin',
        bagNumber: bagNumber || undefined,
        unitsDonated: 1,
        customFields
      });

      if (res.success && res.data) {
        // Immediately add to local state
        setDonors(prev => [res.data!, ...prev.filter(d => d.tokenNumber !== res.data!.tokenNumber)]);
        setUpdateNotification(`Walk-in donor ${name} successfully registered with Token ${res.data.tokenNumber}!`);
        setTimeout(() => setUpdateNotification(null), 4000);
      }

      setIsWalkInModalOpen(false);
    } catch (err: any) {
      alert(err?.message || "Failed to register walk-in donor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC EDIT DONOR RECORD (ADMIN CORRECTION - LIVE REFLECTED)
  // -------------------------------------------------------------
  const openEditDonorModal = (donor: DonorData) => {
    setEditingDonor(donor);
    setEditDonorStatus(donor.status || 'Registered');
    setEditDonorType(donor.donorType || 'regular');

    const vals: Record<string, string> = {
      name: donor.name || '',
      phone: formatPhone(donor.phone) || '',
      cnic: formatCNIC(donor.cnic) || '',
      bloodGroup: donor.bloodGroup || 'O+',
      address: donor.address || '',
      bagNumber: donor.bagNumber || ''
    };

    formFields.forEach(f => {
      if (!['name', 'phone', 'cnic', 'address', 'bloodGroup', 'bagNumber'].includes(f.id)) {
        vals[f.id] = getDonorFieldValue(donor, f);
        if (vals[f.id] === '—') vals[f.id] = '';
      }
    });

    setEditDonorValues(vals);
  };

  const handleSaveDonorEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonor?.id) return;

    const name = (editDonorValues['name'] || editingDonor.name).trim();
    // Strictly format phone and CNIC on edit
    const phone = formatPhone(editDonorValues['phone'] || editingDonor.phone);
    const cnic = formatCNIC(editDonorValues['cnic'] || editingDonor.cnic);
    const bloodGroup = editDonorValues['bloodGroup'] || editingDonor.bloodGroup;
    const address = (editDonorValues['address'] || editingDonor.address).trim();
    const bagNumber = (editDonorValues['bagNumber'] || editingDonor.bagNumber || '').trim();

    // Collect custom fields
    const customFields: Record<string, any> = { ...(editingDonor.customFields || {}) };
    formFields.forEach(f => {
      if (!['name', 'phone', 'cnic', 'address', 'bloodGroup', 'bagNumber'].includes(f.id)) {
        customFields[f.id] = editDonorValues[f.id] || '';
        customFields[f.label] = editDonorValues[f.id] || '';
      }
    });

    const updatedData: Partial<DonorData> = {
      name,
      phone,
      cnic,
      bloodGroup,
      address,
      bagNumber: bagNumber || undefined,
      donorType: editDonorType,
      status: editDonorStatus,
      customFields
    };

    // 1. Instantly update the React state so the corrected details are immediately visible!
    setDonors(prev => prev.map(d => {
      if (d.id === editingDonor.id || d.tokenNumber === editingDonor.tokenNumber) {
        return {
          ...d,
          ...updatedData
        };
      }
      return d;
    }));

    setUpdateNotification(`Corrected details saved for ${name} (${editingDonor.tokenNumber})!`);
    setTimeout(() => setUpdateNotification(null), 4000);

    setIsSubmitting(true);
    try {
      await updateDonorRecord(editingDonor.id, updatedData);
      setEditingDonor(null);
    } catch (err: any) {
      console.warn("Update note:", err);
      setEditingDonor(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered lists
  const walkinDonorsList = useMemo(() => {
    return donors.filter(d => d.donorType === 'walkin');
  }, [donors]);

  const regularDonorsList = useMemo(() => {
    return donors.filter(d => d.donorType !== 'walkin');
  }, [donors]);

  // Determine active donor set based on selected tab
  const currentTabDonors = useMemo(() => {
    if (adminTab === 'walkin') return walkinDonorsList;
    if (adminTab === 'regular') return regularDonorsList;
    return donors;
  }, [adminTab, donors, walkinDonorsList, regularDonorsList]);

  // Apply search & status filter
  const filteredDonors = useMemo(() => {
    return currentTabDonors.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      const formattedCnic = formatCNIC(d.cnic);
      const formattedPh = formatPhone(d.phone);

      const matchesSearch = !q || (
        (d.name && d.name.toLowerCase().includes(q)) ||
        (formattedPh && formattedPh.includes(q)) ||
        (d.phone && d.phone.includes(q)) ||
        (formattedCnic && formattedCnic.includes(q)) ||
        (d.cnic && d.cnic.includes(q)) ||
        (d.tokenNumber && d.tokenNumber.toLowerCase().includes(q)) ||
        (d.address && d.address.toLowerCase().includes(q)) ||
        (d.bloodGroup && d.bloodGroup.toLowerCase().includes(q)) ||
        (d.bagNumber && d.bagNumber.toLowerCase().includes(q)) ||
        (d.customFields && Object.values(d.customFields).some(val => 
          String(val).toLowerCase().includes(q)
        ))
      );

      const matchesStatus = statusFilter === 'all' || (d.status || 'Registered') === statusFilter;
      const matchesBloodGroup = bloodGroupFilter === 'all' || d.bloodGroup === bloodGroupFilter;

      return matchesSearch && matchesStatus && matchesBloodGroup;
    });
  }, [currentTabDonors, searchQuery, statusFilter, bloodGroupFilter]);

  // -------------------------------------------------------------
  // VIEW: AUTH SCREEN (SIMPLE & CLEAN)
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-md w-full mx-auto">
          <button
            onClick={onBackToLanding}
            className="mb-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Camp Page</span>
          </button>

          <div className="bg-white rounded-xs border border-gray-300 p-5 sm:p-7 shadow-xs">
            <div className="text-center mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-100 text-[#ea3a3c] rounded-xs flex items-center justify-center mx-auto mb-2">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Admin Panel Login
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Authorized access to view donor database & manage walk-ins
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  authTab === 'login'
                    ? 'border-[#ea3a3c] text-[#ea3a3c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  authTab === 'register'
                    ? 'border-[#ea3a3c] text-[#ea3a3c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-3.5 p-2.5 rounded-xs bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authTab === 'login' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-2 px-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs rounded-xs flex items-center justify-center gap-2.5 cursor-pointer shadow-xs transition-colors disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickAccess}
                  className="w-full min-h-[44px] py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-[#ea3a3c] font-bold text-xs rounded-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Camp Coordinator 1-Click Access</span>
                </button>

                <div className="relative my-2 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <span className="relative bg-white px-2 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                    Or with email & password
                  </span>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-xs text-base sm:text-sm text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-xs text-base sm:text-sm text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                    />
                  </div>

                  <div className="pt-1.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[44px] py-2.5 bg-[#ea3a3c] hover:bg-[#d0282a] text-white font-bold text-xs uppercase tracking-wider rounded-xs transition-colors cursor-pointer active:scale-98"
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In with Email'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Coordinator Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-xs text-base sm:text-sm text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-xs text-base sm:text-sm text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-xs text-base sm:text-sm text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Secret Pass Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter pass key provided for camp"
                    value={regPasskey}
                    onChange={(e) => setRegPasskey(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-xs text-base sm:text-sm text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] py-2.5 bg-[#ea3a3c] hover:bg-[#d0282a] text-white font-bold text-xs uppercase tracking-wider rounded-xs transition-colors cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? 'Registering...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Header & Responsive Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        {/* Tier 1: Main Brand Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Back button & Camp Branding */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onBackToLanding}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer active:scale-95 shadow-2xs"
              title="Back to Public Registration Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-gray-900 truncate tracking-tight">
                Admin Portal
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live</span>
              </span>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Count Pill (Desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span>{donors.length} Total</span>
            </div>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 shadow-2xs"
              title="Copy Public Registration Form Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-bold hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[#ea3a3c] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 shadow-2xs"
              title="Sign Out from Coordinator Portal"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Dedicated Horizontal Scrollable Tab Bar */}
        <div className="bg-gray-50/90 backdrop-blur-xs border-t border-gray-100 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {/* Tab 1: All Donors */}
            <button
              onClick={() => { setAdminTab('donors'); setSearchQuery(''); }}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none whitespace-nowrap min-h-[38px] ${
                adminTab === 'donors'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${adminTab === 'donors' ? 'text-[#ea3a3c]' : 'text-gray-500'}`} />
              <span>All Donors</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                adminTab === 'donors' ? 'bg-red-50 text-[#ea3a3c]' : 'bg-gray-200/80 text-gray-600'
              }`}>
                {donors.length}
              </span>
            </button>

            {/* Tab 2: Walk-in Donors (Highlight Desk) */}
            <button
              onClick={() => { setAdminTab('walkin'); setSearchQuery(''); }}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none whitespace-nowrap min-h-[38px] ${
                adminTab === 'walkin'
                  ? 'bg-[#ea3a3c] text-white shadow-sm ring-1 ring-[#ea3a3c]'
                  : 'text-red-700 bg-red-50/80 hover:bg-red-100/90 ring-1 ring-red-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Walk-in Donors</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                adminTab === 'walkin' ? 'bg-white/20 text-white' : 'bg-red-200/80 text-red-900'
              }`}>
                {walkinDonorsList.length}
              </span>
            </button>

            {/* Tab 3: Online Pre-Reg */}
            <button
              onClick={() => { setAdminTab('regular'); setSearchQuery(''); }}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none whitespace-nowrap min-h-[38px] ${
                adminTab === 'regular'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <HeartHandshake className={`w-3.5 h-3.5 ${adminTab === 'regular' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span>Online Pre-Reg</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                adminTab === 'regular' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200/80 text-gray-600'
              }`}>
                {regularDonorsList.length}
              </span>
            </button>

            {/* Tab 4: Form Fields Config */}
            <button
              onClick={() => setAdminTab('form-builder')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none whitespace-nowrap min-h-[38px] ${
                adminTab === 'form-builder'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Sliders className={`w-3.5 h-3.5 ${adminTab === 'form-builder' ? 'text-amber-600' : 'text-gray-500'}`} />
              <span>Form Fields</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                adminTab === 'form-builder' ? 'bg-amber-50 text-amber-700' : 'bg-gray-200/80 text-gray-600'
              }`}>
                {formFields.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full">
        {/* Dynamic Alert Notification Banner */}
        {updateNotification && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xs flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{updateNotification}</span>
            </div>
            <button onClick={() => setUpdateNotification(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: DEDICATED SEPARATE WALK-IN DONORS LIST            */}
        {/* ========================================================= */}
        {adminTab === 'walkin' && (
          <div className="space-y-4 animate-fade-in">
            {/* Walk-in Banner & Quick Stats */}
            <div className="bg-white rounded-xs border border-gray-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
                      Dedicated Registry
                    </span>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                      Walk-in Blood Donors (Camp Desk & Hospital Visits)
                    </h1>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Separate dedicated queue for on-site arrivals. All CNIC (XXXXX-XXXXXXX-X) and Phone (03XX-XXXXXXX) entries are strictly formatted.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={openWalkInModal}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#ea3a3c] hover:bg-[#d0282a] rounded-xs transition-colors shadow-xs flex items-center gap-1.5 active:scale-98 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register New Walk-in Donor</span>
                  </button>

                  <button
                    onClick={() => handleExportCSV(walkinDonorsList, 'Walkin_Donors')}
                    className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Walk-ins</span>
                  </button>
                </div>
              </div>

              {/* Quick metrics for Walk-in desk */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-red-50/60 p-3 rounded-xs border border-red-100">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Total Walk-ins</span>
                  <div className="text-xl font-black text-gray-900 mt-0.5">{walkinDonorsList.length}</div>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xs border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Donated (Collected)</span>
                  <div className="text-xl font-black text-emerald-800 mt-0.5">
                    {walkinDonorsList.filter(d => d.status === 'Donated').length}
                  </div>
                </div>
                <div className="bg-blue-50/60 p-3 rounded-xs border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">In Screening</span>
                  <div className="text-xl font-black text-blue-800 mt-0.5">
                    {walkinDonorsList.filter(d => d.status === 'Registered' || d.status === 'Confirmed').length}
                  </div>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-xs border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Deferred</span>
                  <div className="text-xl font-black text-amber-800 mt-0.5">
                    {walkinDonorsList.filter(d => d.status === 'Deferred').length}
                  </div>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by walk-in name, token #, formatted CNIC or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xs focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={bloodGroupFilter}
                    onChange={e => setBloodGroupFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xs text-gray-800 font-semibold"
                  >
                    <option value="all">All Blood Groups</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>Blood Group: {bg}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xs text-gray-800 font-semibold"
                  >
                    <option value="all">All Statuses ({walkinDonorsList.length})</option>
                    <option value="Registered">Registered (Screening)</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Donated">Donated</option>
                    <option value="Deferred">Deferred</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Walk-in Donors Table / List */}
            <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#ea3a3c]" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Separate Walk-in Donors Records
                  </span>
                  <span className="text-[11px] text-gray-500 font-normal">
                    ({filteredDonors.length} of {walkinDonorsList.length} shown)
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">
                  No localStorage · Direct Firestore
                </span>
              </div>

              {filteredDonors.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-[#ea3a3c] mx-auto flex items-center justify-center mb-3">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No Walk-in Donors Found</h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                    No walk-in records match the current filter. Click below to register an on-site walk-in donor.
                  </p>
                  <button
                    onClick={openWalkInModal}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#ea3a3c] rounded-xs hover:bg-[#d0282a] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Walk-in Donor</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                          <th className="py-3 px-3.5">Token #</th>
                          <th className="py-3 px-3.5">Donor Name</th>
                          <th className="py-3 px-3.5">CNIC (Formatted)</th>
                          <th className="py-3 px-3.5">Phone (Formatted)</th>
                          <th className="py-3 px-3.5">Blood Group</th>
                          <th className="py-3 px-3.5">Bag # / Area</th>
                          <th className="py-3 px-3.5">Status</th>
                          <th className="py-3 px-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-800">
                        {filteredDonors.map(donor => {
                          const formattedCnic = formatCNIC(donor.cnic);
                          const formattedPhoneNum = formatPhone(donor.phone);

                          return (
                            <tr key={donor.id || donor.tokenNumber} className="hover:bg-gray-50/80 transition-colors">
                              {/* Token # */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="font-mono font-bold text-[#ea3a3c] bg-red-50 px-2 py-0.5 rounded">
                                  {donor.tokenNumber}
                                </span>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {donor.registeredAt || 'Today'}
                                </div>
                              </td>

                              {/* Name */}
                              <td className="py-3 px-3.5 font-semibold text-gray-900">
                                {donor.name}
                                <span className="block text-[10px] text-red-700 font-bold uppercase tracking-wider mt-0.5">
                                  Walk-in
                                </span>
                              </td>

                              {/* CNIC (Formatted) */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-gray-900 font-bold tracking-wide">
                                    {formattedCnic || '—'}
                                  </span>
                                  {formattedCnic && (
                                    <button
                                      onClick={() => handleCopyText(formattedCnic, `cnic-${donor.id}`)}
                                      title="Copy CNIC"
                                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                    >
                                      {copiedTextId === `cnic-${donor.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Phone (Formatted) */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-gray-900 font-semibold">
                                    {formattedPhoneNum || '—'}
                                  </span>
                                  {formattedPhoneNum && (
                                    <button
                                      onClick={() => handleCopyText(formattedPhoneNum, `ph-${donor.id}`)}
                                      title="Copy Phone"
                                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                    >
                                      {copiedTextId === `ph-${donor.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <a
                                    href={`tel:${formattedPhoneNum.replace(/\D/g, '')}`}
                                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Call</span>
                                  </a>
                                  <span>·</span>
                                  <a
                                    href={getWhatsAppUrl(formattedPhoneNum, donor.name, donor.bloodGroup)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                </div>
                              </td>

                              {/* Blood Group */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="font-bold text-[#ea3a3c] bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs">
                                  {donor.bloodGroup}
                                </span>
                              </td>

                              {/* Bag Number / Area */}
                              <td className="py-3 px-3.5 max-w-[180px] truncate">
                                {donor.bagNumber ? (
                                  <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                                    Bag #{donor.bagNumber}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">{donor.address || 'Desk Visit'}</span>
                                )}
                              </td>

                              {/* Status Dropdown */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <select
                                  value={donor.status || 'Registered'}
                                  onChange={(e) => handleStatusChange(donor.id!, e.target.value as any)}
                                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 cursor-pointer"
                                >
                                  <option value="Registered">Registered</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Donated">Donated</option>
                                  <option value="Deferred">Deferred</option>
                                </select>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handlePrintSlip(donor)}
                                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded cursor-pointer"
                                    title="Print Walk-in Slip"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openEditDonorModal(donor)}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                                    title="Edit Walk-in Record"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDonorToDelete(donor)}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="block md:hidden divide-y divide-gray-100">
                    {filteredDonors.map(donor => {
                      const formattedCnic = formatCNIC(donor.cnic);
                      const formattedPhoneNum = formatPhone(donor.phone);

                      return (
                        <div key={donor.id || donor.tokenNumber} className="p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-[#ea3a3c] bg-red-50 px-2 py-0.5 rounded">
                              {donor.tokenNumber}
                            </span>
                            <span className="font-bold text-xs bg-red-100 text-[#ea3a3c] px-2 py-0.5 rounded">
                              {donor.bloodGroup}
                            </span>
                          </div>

                          <div>
                            <strong className="text-sm font-bold text-gray-900 block">{donor.name}</strong>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                              <span className="font-mono font-bold">{formattedCnic}</span>
                              <span className="text-gray-400">·</span>
                              <span className="font-mono font-bold">{formattedPhoneNum}</span>
                            </div>
                            {donor.bagNumber && (
                              <span className="inline-block mt-1 font-mono text-[11px] font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                                Bag #{donor.bagNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                            <select
                              value={donor.status || 'Registered'}
                              onChange={(e) => handleStatusChange(donor.id!, e.target.value as any)}
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold"
                            >
                              <option value="Registered">Registered</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Donated">Donated</option>
                              <option value="Deferred">Deferred</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handlePrintSlip(donor)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 rounded"
                                title="Print Slip"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditDonorModal(donor)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDonorToDelete(donor)}
                                className="p-1.5 text-red-600 hover:text-red-800 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: REGULAR PRE-REGISTERED DONORS LIST                */}
        {/* ========================================================= */}
        {adminTab === 'regular' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-xs border border-gray-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                      Online Pre-Registration
                    </span>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                      Regular Voluntary Donors List
                    </h1>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Community donors pre-registered via public form. All CNIC and Phone numbers are strictly formatted.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportCSV(regularDonorsList, 'Regular_Online_Donors')}
                    className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Regular Donors</span>
                  </button>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, token #, formatted CNIC or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xs focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={bloodGroupFilter}
                    onChange={e => setBloodGroupFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xs text-gray-800 font-semibold"
                  >
                    <option value="all">All Blood Groups</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>Blood Group: {bg}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xs text-gray-800 font-semibold"
                  >
                    <option value="all">All Statuses ({regularDonorsList.length})</option>
                    <option value="Registered">Registered</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Donated">Donated</option>
                    <option value="Deferred">Deferred</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Regular Donors Table */}
            <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Regular / Online Registrations ({filteredDonors.length})
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  Strictly Formatted Phone & CNIC
                </span>
              </div>

              {filteredDonors.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  No online registrations match your search.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        <th className="py-3 px-3.5">Token #</th>
                        <th className="py-3 px-3.5">Full Name</th>
                        <th className="py-3 px-3.5">CNIC (Formatted)</th>
                        <th className="py-3 px-3.5">Phone (Formatted)</th>
                        <th className="py-3 px-3.5">Blood Group</th>
                        <th className="py-3 px-3.5">Residential Address</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {filteredDonors.map(donor => {
                        const formattedCnic = formatCNIC(donor.cnic);
                        const formattedPhoneNum = formatPhone(donor.phone);

                        return (
                          <tr key={donor.id || donor.tokenNumber} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="font-mono font-bold text-[#ea3a3c] bg-red-50 px-2 py-0.5 rounded">
                                {donor.tokenNumber}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 font-semibold text-gray-900">
                              {donor.name}
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-gray-900 font-bold">
                                  {formattedCnic || '—'}
                                </span>
                                {formattedCnic && (
                                  <button
                                    onClick={() => handleCopyText(formattedCnic, `cnic-${donor.id}`)}
                                    title="Copy CNIC"
                                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                  >
                                    {copiedTextId === `cnic-${donor.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-gray-900 font-semibold">
                                  {formattedPhoneNum || '—'}
                                </span>
                                {formattedPhoneNum && (
                                  <button
                                    onClick={() => handleCopyText(formattedPhoneNum, `ph-${donor.id}`)}
                                    title="Copy Phone"
                                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                  >
                                    {copiedTextId === `ph-${donor.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <a
                                  href={`tel:${formattedPhoneNum.replace(/\D/g, '')}`}
                                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call</span>
                                </a>
                                <span>·</span>
                                <a
                                  href={getWhatsAppUrl(formattedPhoneNum, donor.name, donor.bloodGroup)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="font-bold text-[#ea3a3c] bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs">
                                {donor.bloodGroup}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 max-w-[200px] truncate" title={donor.address}>
                              {donor.address}
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <select
                                value={donor.status || 'Registered'}
                                onChange={(e) => handleStatusChange(donor.id!, e.target.value as any)}
                                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 cursor-pointer"
                              >
                                <option value="Registered">Registered</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Donated">Donated</option>
                                <option value="Deferred">Deferred</option>
                              </select>
                            </td>

                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handlePrintSlip(donor)}
                                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded cursor-pointer"
                                  title="Print Slip"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditDonorModal(donor)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                                  title="Edit Record"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDonorToDelete(donor)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: ALL DONORS COMBINED VIEW                          */}
        {/* ========================================================= */}
        {adminTab === 'donors' && (
          <div className="space-y-4 animate-fade-in">
            {/* Top Bar with Search, Walk-in Registration, Status Filter */}
            <div className="bg-white rounded-xs border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search any name, formatted phone, CNIC, token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[40px] pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xs text-xs text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>

                {/* Blood Group Filter */}
                <select
                  value={bloodGroupFilter}
                  onChange={(e) => setBloodGroupFilter(e.target.value)}
                  className="min-h-[40px] px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-xs text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="all">All Blood Groups</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="min-h-[40px] px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-xs text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="all">All Statuses ({donors.length})</option>
                  <option value="Registered">Registered</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Donated">Donated</option>
                  <option value="Deferred">Deferred</option>
                </select>
              </div>

              {/* Action Buttons: Add Walk-In Donor & CSV Export */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-stretch sm:justify-end">
                <button
                  onClick={openWalkInModal}
                  className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 bg-[#ea3a3c] hover:bg-[#d0282a] text-white rounded-xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Register Walk-in Donor</span>
                </button>

                <button
                  onClick={() => handleExportCSV(donors, 'All_Donors')}
                  className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="hidden md:flex min-h-[40px] px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xs text-xs font-bold items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Donors Container */}
            {filteredDonors.length === 0 ? (
              <div className="bg-white rounded-xs border border-gray-200 p-8 sm:p-12 text-center text-gray-400">
                <p className="text-sm font-semibold">No donor registrations match your filter.</p>
                <p className="text-xs mt-1">Registrations submitted from the public form or added via walk-in will appear here.</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden space-y-3">
                  {filteredDonors.map((donor) => {
                    const formattedCnic = formatCNIC(donor.cnic);
                    const formattedPhoneNum = formatPhone(donor.phone);

                    return (
                      <div 
                        key={donor.id || donor.tokenNumber} 
                        className="bg-white rounded-xs border border-gray-200 p-3.5 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#ea3a3c] bg-red-50 px-2 py-0.5 rounded-xs">
                              {donor.tokenNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              donor.donorType === 'walkin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {donor.donorType === 'walkin' ? 'Walk-in' : 'Online'}
                            </span>
                          </div>
                          <span className="font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-xs">
                            {donor.bloodGroup || '—'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                            <span className="text-gray-500 font-medium">Name:</span>
                            <span className="font-bold text-gray-900">{donor.name}</span>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                            <span className="text-gray-500 font-medium">CNIC:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-gray-900">{formattedCnic || '—'}</span>
                              {formattedCnic && (
                                <button
                                  onClick={() => handleCopyText(formattedCnic, `cnic-m-${donor.id}`)}
                                  className="text-gray-400 p-0.5"
                                >
                                  {copiedTextId === `cnic-m-${donor.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                            <span className="text-gray-500 font-medium">Phone:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-900">{formattedPhoneNum || '—'}</span>
                              <a href={`tel:${formattedPhoneNum.replace(/\D/g, '')}`} className="p-1 bg-gray-100 rounded text-gray-700">
                                <Phone className="w-3 h-3" />
                              </a>
                              <a href={getWhatsAppUrl(formattedPhoneNum, donor.name, donor.bloodGroup)} target="_blank" rel="noreferrer" className="p-1 bg-emerald-50 rounded text-emerald-700">
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                            <span className="text-gray-500 font-medium">Address:</span>
                            <span className="text-gray-800 text-right max-w-[200px] truncate">{donor.address}</span>
                          </div>

                          {donor.bagNumber && (
                            <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                              <span className="text-gray-500 font-medium">Bag Number:</span>
                              <span className="font-mono font-bold text-gray-900">{donor.bagNumber}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                          <select
                            value={donor.status || 'Registered'}
                            onChange={(e) => handleStatusChange(donor.id!, e.target.value as any)}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800"
                          >
                            <option value="Registered">Registered</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Donated">Donated</option>
                            <option value="Deferred">Deferred</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handlePrintSlip(donor)}
                              className="text-gray-600 hover:text-gray-900 p-1.5 rounded"
                              title="Print Slip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditDonorModal(donor)}
                              className="text-gray-600 hover:text-[#ea3a3c] p-1.5 rounded"
                              title="Edit Donor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDonorToDelete(donor)}
                              className="text-gray-400 hover:text-red-700 p-1.5 rounded"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xs border border-gray-200 overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Token</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Donor Name</th>
                        <th className="py-2.5 px-3">CNIC (Formatted)</th>
                        <th className="py-2.5 px-3">Phone (Formatted)</th>
                        <th className="py-2.5 px-3">Blood Group</th>
                        <th className="py-2.5 px-3">Address</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {filteredDonors.map((donor) => {
                        const formattedCnic = formatCNIC(donor.cnic);
                        const formattedPhoneNum = formatPhone(donor.phone);

                        return (
                          <tr key={donor.id || donor.tokenNumber} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#ea3a3c]">
                              {donor.tokenNumber}
                            </td>

                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                donor.donorType === 'walkin'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {donor.donorType === 'walkin' ? 'Walk-in' : 'Online'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-semibold text-gray-900">
                              {donor.name}
                            </td>

                            {/* Formatted CNIC */}
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              <div className="flex items-center gap-1.5">
                                <span>{formattedCnic || '—'}</span>
                                {formattedCnic && (
                                  <button
                                    onClick={() => handleCopyText(formattedCnic, `cnic-tbl-${donor.id}`)}
                                    title="Copy CNIC"
                                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                  >
                                    {copiedTextId === `cnic-tbl-${donor.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Formatted Phone */}
                            <td className="py-2.5 px-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900">{formattedPhoneNum || '—'}</span>
                                {formattedPhoneNum && (
                                  <button
                                    onClick={() => handleCopyText(formattedPhoneNum, `ph-tbl-${donor.id}`)}
                                    title="Copy Phone"
                                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                  >
                                    {copiedTextId === `ph-tbl-${donor.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                                <a
                                  href={`tel:${formattedPhoneNum.replace(/\D/g, '')}`}
                                  className="text-gray-400 hover:text-[#ea3a3c] ml-0.5"
                                  title="Call"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                                <a
                                  href={getWhatsAppUrl(formattedPhoneNum, donor.name, donor.bloodGroup)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gray-400 hover:text-emerald-600"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              </div>
                            </td>

                            {/* Blood Group */}
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-[#ea3a3c] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                {donor.bloodGroup}
                              </span>
                            </td>

                            {/* Address */}
                            <td className="py-2.5 px-3 max-w-[200px] truncate" title={donor.address}>
                              {donor.address}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3">
                              <select
                                value={donor.status || 'Registered'}
                                onChange={(e) => handleStatusChange(donor.id!, e.target.value as any)}
                                className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-medium cursor-pointer"
                              >
                                <option value="Registered">Registered</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Donated">Donated</option>
                                <option value="Deferred">Deferred</option>
                              </select>
                            </td>

                            {/* Registered At */}
                            <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                              {donor.registeredAt || '—'}
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handlePrintSlip(donor)}
                                  className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
                                  title="Print Slip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditDonorModal(donor)}
                                  className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
                                  title="Edit Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDonorToDelete(donor)}
                                  className="text-gray-400 hover:text-red-700 p-1 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: FORM BUILDER / CUSTOMIZER                         */}
        {/* ========================================================= */}
        {adminTab === 'form-builder' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-xs border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#ea3a3c]" />
                  <span>Public Registration Form Builder & Customizer</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Any field you add, reorder, or edit syncs directly with Firestore and reflects immediately on the registration page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openAddFieldModal}
                  className="min-h-[38px] px-3.5 py-1.5 bg-[#ea3a3c] hover:bg-[#d0282a] text-white rounded-xs text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Field</span>
                </button>
                <button
                  onClick={handleResetFormFields}
                  className="min-h-[38px] px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xs text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Reset to default fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              </div>
            </div>

            {formConfigSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{formConfigSuccess}</span>
              </div>
            )}

            {/* List of Form Fields with Re-Order & Edit Controls */}
            <div className="bg-white rounded-xs border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Active Form Fields in Display Order ({formFields.length})</span>
                <span className="text-[11px] text-gray-500">Use ▲ / ▼ buttons to align order</span>
              </div>

              <div className="divide-y divide-gray-100">
                {formFields.map((field, index) => (
                  <div 
                    key={field.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === formFields.length - 1}
                          className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <strong className="text-sm font-bold text-gray-900">
                            {field.label}
                          </strong>
                          {field.required && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Required
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded">
                            {field.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Placeholder: <span className="italic font-medium text-gray-700">"{field.placeholder}"</span>
                          {field.options && field.options.length > 0 && (
                            <span className="ml-2 text-gray-600">
                              Options: {field.options.join(', ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => openEditFieldModal(field)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xs text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xs text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Remove field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: REGISTER WALK-IN DONOR (CAMP RECEPTION DESK)       */}
      {/* ========================================================= */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xs max-w-lg w-full p-4 sm:p-6 shadow-xl space-y-4 animate-fade-in my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                  Reception Desk
                </span>
                <h3 className="font-heading font-bold text-base text-gray-900 mt-1">
                  Register Walk-in Blood Donor
                </h3>
              </div>
              <button 
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWalkInDonor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Donor Full Name <span className="text-[#ea3a3c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Farooq"
                  value={walkInValues.name || ''}
                  onChange={(e) => setWalkInValues({ ...walkInValues, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-[#ea3a3c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Phone / WhatsApp <span className="text-[#ea3a3c]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    value={walkInValues.phone || ''}
                    onChange={(e) => setWalkInValues({ ...walkInValues, phone: formatPhone(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-mono text-sm focus:outline-none focus:border-[#ea3a3c]"
                  />
                  <span className="text-[10px] text-gray-400">Formatted: 03XX-XXXXXXX</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    CNIC Number
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="42101-1234567-1"
                    value={walkInValues.cnic || ''}
                    onChange={(e) => setWalkInValues({ ...walkInValues, cnic: formatCNIC(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-mono text-sm focus:outline-none focus:border-[#ea3a3c]"
                  />
                  <span className="text-[10px] text-gray-400">Formatted: XXXXX-XXXXXXX-X</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Blood Group <span className="text-[#ea3a3c]">*</span>
                  </label>
                  <select
                    value={walkInValues.bloodGroup || 'O+'}
                    onChange={(e) => setWalkInValues({ ...walkInValues, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-bold focus:outline-none focus:border-[#ea3a3c]"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Blood Bag # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BAG-048"
                    value={walkInValues.bagNumber || ''}
                    onChange={(e) => setWalkInValues({ ...walkInValues, bagNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-mono focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Residential Area / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 18, Madina Colony, Scheme 33"
                  value={walkInValues.address || ''}
                  onChange={(e) => setWalkInValues({ ...walkInValues, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#ea3a3c] hover:bg-[#d0282a] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Registering...' : 'Register Walk-in & Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT DONOR RECORD (CORRECTED SHOWS IMMEDIATELY)      */}
      {/* ========================================================= */}
      {editingDonor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xs max-w-lg w-full p-4 sm:p-6 shadow-xl space-y-4 animate-fade-in my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Edit & Correct Donor Details
                </h3>
                <span className="font-mono text-xs text-[#ea3a3c] font-bold">
                  Token: {editingDonor.tokenNumber} · {editDonorType === 'walkin' ? 'Walk-in' : 'Online Pre-Reg'}
                </span>
              </div>
              <button 
                onClick={() => setEditingDonor(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDonorEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editDonorValues['name'] || ''}
                  onChange={(e) => setEditDonorValues({ ...editDonorValues, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-[#ea3a3c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Phone Number (Formatted)
                  </label>
                  <input
                    type="tel"
                    required
                    value={editDonorValues['phone'] || ''}
                    onChange={(e) => setEditDonorValues({
                      ...editDonorValues,
                      phone: formatPhone(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-mono text-sm focus:outline-none focus:border-[#ea3a3c]"
                  />
                  <span className="text-[10px] text-gray-400">Strictly formatted 03XX-XXXXXXX</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    CNIC (Formatted)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={editDonorValues['cnic'] || ''}
                    onChange={(e) => setEditDonorValues({
                      ...editDonorValues,
                      cnic: formatCNIC(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-mono text-sm focus:outline-none focus:border-[#ea3a3c]"
                  />
                  <span className="text-[10px] text-gray-400">Strictly formatted XXXXX-XXXXXXX-X</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={editDonorValues['bloodGroup'] || 'O+'}
                    onChange={(e) => setEditDonorValues({ ...editDonorValues, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-bold focus:outline-none focus:border-[#ea3a3c] cursor-pointer"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Donor Type Category
                  </label>
                  <select
                    value={editDonorType}
                    onChange={(e) => setEditDonorType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-bold focus:outline-none focus:border-[#ea3a3c] cursor-pointer"
                  >
                    <option value="regular">Regular / Online Pre-Registration</option>
                    <option value="walkin">Walk-in (Camp Reception Desk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Residential Area / Address
                </label>
                <input
                  type="text"
                  value={editDonorValues['address'] || ''}
                  onChange={(e) => setEditDonorValues({ ...editDonorValues, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-[#ea3a3c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Camp Status
                  </label>
                  <select
                    value={editDonorStatus}
                    onChange={(e) => setEditDonorStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-bold focus:outline-none focus:border-[#ea3a3c] cursor-pointer"
                  >
                    <option value="Registered">Registered</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Donated">Donated</option>
                    <option value="Deferred">Deferred</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Bag Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={editDonorValues['bagNumber'] || ''}
                    onChange={(e) => setEditDonorValues({ ...editDonorValues, bagNumber: e.target.value })}
                    placeholder="e.g. BAG-012"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-mono focus:outline-none focus:border-[#ea3a3c]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#ea3a3c] hover:bg-[#d0282a] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Update & Apply Immediately'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT FORM FIELD MODAL                        */}
      {/* ========================================================= */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xs max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-heading font-bold text-base text-gray-900">
                {editingField ? 'Edit Field' : 'Add New Registration Field'}
              </h3>
              <button onClick={() => setIsFieldModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Field Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Contact, Profession"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Input Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-bold"
                >
                  <option value="text">Text (Single Line)</option>
                  <option value="tel">Telephone / Phone</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown Select</option>
                  <option value="textarea">Textarea (Multi-line)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Placeholder Text</label>
                <input
                  type="text"
                  placeholder="e.g. Enter relative phone number"
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>

              {fieldType === 'select' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Options (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Option 1, Option 2, Option 3"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req_box"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                  className="rounded text-[#ea3a3c]"
                />
                <label htmlFor="req_box" className="font-bold text-gray-700 cursor-pointer">
                  Required field
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ea3a3c] hover:bg-[#d0282a] text-white rounded text-xs font-bold cursor-pointer"
                >
                  Save Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Guarantees deletion in iframes) */}
      {donorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Delete Donor Record?</h3>
            <p className="text-xs text-gray-500 text-center mt-1.5 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900">{donorToDelete.name}</strong> (<span className="font-mono text-red-600 font-bold">{donorToDelete.tokenNumber}</span>) from Cloud Firestore? This cannot be undone.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDonorToDelete(null)}
                className="flex-1 min-h-[42px] py-2 px-3 border border-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteDonor(donorToDelete)}
                className="flex-1 min-h-[42px] py-2 px-3 bg-[#ea3a3c] hover:bg-[#d0282a] text-white text-xs font-bold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
