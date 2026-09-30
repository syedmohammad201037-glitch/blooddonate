import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, UserCheck, Users, ShieldAlert } from 'lucide-react';
import { Donor, BloodGroup, DonorStatus, DonorType } from '../types/donor';
import { formatCNIC, formatPhone, isValidCNIC, isValidPhone } from '../utils/formatters';

interface DonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorToEdit?: Donor | null;
  defaultType?: DonorType;
  onSave: (donorData: any) => Promise<void>;
}

export const DonorModal: React.FC<DonorModalProps> = ({
  isOpen,
  onClose,
  donorToEdit,
  defaultType = 'walkin',
  onSave,
}) => {
  const isEditing = Boolean(donorToEdit);

  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    phone: '',
    bloodGroup: 'O+' as BloodGroup,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    age: 26,
    city: 'Karachi',
    address: '',
    donorType: defaultType as DonorType,
    status: 'Donated' as DonorStatus,

    // Walk-in fields
    tokenNumber: '',
    centerName: 'Civil Hospital Blood Center',
    walkinDate: new Date().toISOString().slice(0, 10),
    unitsDonated: 1,
    hemoglobin: 14.0,
    weight: 70,
    bagNumber: '',
    referredPatient: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync form data when modal opens or donorToEdit changes
  useEffect(() => {
    if (donorToEdit) {
      setFormData({
        name: donorToEdit.name || '',
        cnic: formatCNIC(donorToEdit.cnic),
        phone: formatPhone(donorToEdit.phone),
        bloodGroup: donorToEdit.bloodGroup || 'O+',
        gender: donorToEdit.gender || 'Male',
        age: donorToEdit.age || 25,
        city: donorToEdit.city || 'Karachi',
        address: donorToEdit.address || '',
        donorType: donorToEdit.donorType || 'walkin',
        status: donorToEdit.status || 'Available',
        tokenNumber: donorToEdit.tokenNumber || '',
        centerName: donorToEdit.centerName || 'Civil Hospital Blood Center',
        walkinDate: donorToEdit.walkinDate || new Date().toISOString().slice(0, 10),
        unitsDonated: donorToEdit.unitsDonated ?? 1,
        hemoglobin: donorToEdit.hemoglobin ?? 14.0,
        weight: donorToEdit.weight ?? 70,
        bagNumber: donorToEdit.bagNumber || '',
        referredPatient: donorToEdit.referredPatient || '',
        notes: donorToEdit.notes || '',
      });
    } else {
      const randomTokenSuffix = Math.floor(100 + Math.random() * 900);
      setFormData({
        name: '',
        cnic: '',
        phone: '',
        bloodGroup: 'O+',
        gender: 'Male',
        age: 26,
        city: 'Karachi',
        address: '',
        donorType: defaultType,
        status: defaultType === 'walkin' ? 'Donated' : 'Available',
        tokenNumber: defaultType === 'walkin' ? `WI-2026-${randomTokenSuffix}` : '',
        centerName: 'Civil Hospital Blood Bank',
        walkinDate: new Date().toISOString().slice(0, 10),
        unitsDonated: 1,
        hemoglobin: 14.2,
        weight: 68,
        bagNumber: defaultType === 'walkin' ? `BAG-${Math.floor(8000 + Math.random() * 2000)}` : '',
        referredPatient: '',
        notes: '',
      });
    }
    setErrorMsg(null);
  }, [donorToEdit, defaultType, isOpen]);

  if (!isOpen) return null;

  // Handle CNIC live auto-formatting
  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCNIC(raw);
    setFormData(prev => ({ ...prev, cnic: formatted }));
  };

  // Handle Phone live auto-formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatPhone(raw);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg('Please enter the donor full name.');
      return;
    }

    if (!formData.cnic.trim()) {
      setErrorMsg('Please enter the CNIC number.');
      return;
    }

    const cnicDigits = formData.cnic.replace(/\D/g, '');
    if (cnicDigits.length !== 13) {
      setErrorMsg(`CNIC must be exactly 13 digits (currently ${cnicDigits.length} digits). Format: 42101-1234567-1`);
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMsg('Please enter the phone number.');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      setErrorMsg(`Phone number must be 11 digits (e.g. 0300-1234567).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        ...formData,
        cnic: formatCNIC(formData.cnic),
        phone: formatPhone(formData.phone),
        age: Number(formData.age),
        unitsDonated: Number(formData.unitsDonated),
        hemoglobin: Number(formData.hemoglobin),
        weight: Number(formData.weight),
      };

      if (formData.donorType === 'walkin' && !payload.tokenNumber) {
        payload.tokenNumber = `WI-2026-${Math.floor(100 + Math.random() * 900)}`;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save donor record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad'];

  const cnicValid = isValidCNIC(formData.cnic);
  const phoneValid = isValidPhone(formData.phone);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {formData.donorType === 'walkin' ? (
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <UserCheck className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Users className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold">
                {isEditing
                  ? `Update Donor Record: ${donorToEdit?.name}`
                  : formData.donorType === 'walkin'
                  ? 'Register Walk-in Blood Donor'
                  : 'Register Regular Voluntary Donor'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Corrected details will update immediately across all lists and admin console'
                  : 'Strict CNIC and phone formatting will be automatically applied'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Donor Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Registration Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, donorType: 'walkin', status: 'Donated' }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                  formData.donorType === 'walkin'
                    ? 'border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4 text-red-600" />
                <span>Walk-in Donor (On-site Center)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, donorType: 'regular', status: 'Available' }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                  formData.donorType === 'regular'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Regular Voluntary (On Standby)</span>
              </button>
            </div>
          </div>

          {/* Primary Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Muhammad Hamza Tariq"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group *
              </label>
              <select
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Formatted CNIC & Formatted Phone Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            {/* CNIC with live auto-masking */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900">
                  Pakistani CNIC (Formatted) *
                </label>
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  {formData.cnic.replace(/\D/g, '').length}/13 digits
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.cnic}
                  onChange={handleCNICChange}
                  placeholder="42101-1234567-1"
                  maxLength={15}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {cnicValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-amber-600 font-sans font-medium">
                      Auto-hyphenating
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Standard format: 5 digits - 7 digits - 1 digit
              </p>
            </div>

            {/* Phone with live auto-masking */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900">
                  Mobile Phone (Formatted) *
                </label>
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  {formData.phone.replace(/\D/g, '').length}/11 digits
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="0300-1234567"
                  maxLength={12}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {phoneValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-amber-600 font-sans font-medium">
                      Auto-hyphenating
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Standard format: 03XX-XXXXXXX
              </p>
            </div>
          </div>

          {/* Age, Gender, City, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min={18}
                max={65}
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City
              </label>
              <select
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                {cities.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as DonorStatus })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="Available">Available</option>
                <option value="Donated">Donated</option>
                <option value="Deferred">Deferred</option>
                <option value="Pending Screening">Pending</option>
              </select>
            </div>
          </div>

          {/* Walk-in Specific Details Section */}
          {formData.donorType === 'walkin' && (
            <div className="p-4 rounded-xl border border-red-200/80 bg-red-50/40 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-red-100">
                <UserCheck className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-red-900 uppercase tracking-wider">
                  Walk-in Clinical & Donation Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Walk-in Token #
                  </label>
                  <input
                    type="text"
                    value={formData.tokenNumber}
                    onChange={e => setFormData({ ...formData, tokenNumber: e.target.value })}
                    placeholder="e.g. WI-2026-105"
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-red-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Center / Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.centerName}
                    onChange={e => setFormData({ ...formData, centerName: e.target.value })}
                    placeholder="Blood Transfusion Center"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-red-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Walk-in Date
                  </label>
                  <input
                    type="date"
                    value={formData.walkinDate}
                    onChange={e => setFormData({ ...formData, walkinDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-red-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Units Donated
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    value={formData.unitsDonated}
                    onChange={e => setFormData({ ...formData, unitsDonated: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-red-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Hemoglobin (g/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={8}
                    max={20}
                    value={formData.hemoglobin}
                    onChange={e => setFormData({ ...formData, hemoglobin: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-red-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={45}
                    max={150}
                    value={formData.weight}
                    onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-red-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Blood Bag ID
                  </label>
                  <input
                    type="text"
                    value={formData.bagNumber}
                    onChange={e => setFormData({ ...formData, bagNumber: e.target.value })}
                    placeholder="BAG-8829"
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-red-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Referred Patient / Hospital Case (Optional)
                </label>
                <input
                  type="text"
                  value={formData.referredPatient}
                  onChange={e => setFormData({ ...formData, referredPatient: e.target.value })}
                  placeholder="e.g. Ward 4 Bed 9 / Thalassemia replacement"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-red-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Address & Medical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Area / Notes
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Gulshan-e-Iqbal Block 13, Karachi"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medical & Screening Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Screening history, medical clearance, allergies, deferral reason..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update & Save Changes'
                  : 'Register Donor'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
