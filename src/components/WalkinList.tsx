import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Phone,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Layers,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import { Donor, BloodGroup } from '../types/donor';
import { formatCNIC, formatPhone, formatDate, getWhatsAppUrl } from '../utils/formatters';

interface WalkinListProps {
  donors: Donor[];
  onOpenAddModal: () => void;
  onEditDonor: (donor: Donor) => void;
  onDeleteDonor: (id: string) => void;
  onPrintSlip: (donor: Donor) => void;
}

export const WalkinList: React.FC<WalkinListProps> = ({
  donors,
  onOpenAddModal,
  onEditDonor,
  onDeleteDonor,
  onPrintSlip,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter only walk-in donors
  const walkinDonors = useMemo(() => {
    return donors.filter(d => d.donorType === 'walkin');
  }, [donors]);

  // Apply search and filter criteria
  const filteredDonors = useMemo(() => {
    return walkinDonors.filter(donor => {
      const formattedCnic = formatCNIC(donor.cnic);
      const formattedPh = formatPhone(donor.phone);
      const searchMatch =
        !searchTerm ||
        donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedCnic.includes(searchTerm) ||
        formattedPh.includes(searchTerm) ||
        (donor.tokenNumber && donor.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (donor.centerName && donor.centerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        donor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donor.bagNumber && donor.bagNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const bgMatch = selectedBloodGroup === 'all' || donor.bloodGroup === selectedBloodGroup;
      const statusMatch = selectedStatus === 'all' || donor.status === selectedStatus;

      return searchMatch && bgMatch && statusMatch;
    });
  }, [walkinDonors, searchTerm, selectedBloodGroup, selectedStatus]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
                Dedicated Registry
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Walk-in Blood Donors List
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Real-time on-site hospital desk & blood transfusion center visits.
              All CNIC and phone records are strictly verified and formatted.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Walk-in Donor</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by donor name, token #, formatted CNIC or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Blood Group Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedBloodGroup}
              onChange={e => setSelectedBloodGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-medium"
            >
              <option value="all">All Blood Groups</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>
                  Blood Group: {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-medium"
            >
              <option value="all">All Screening Statuses</option>
              <option value="Donated">Donated (Collected)</option>
              <option value="Deferred">Deferred (Medical)</option>
              <option value="Pending Screening">Pending Screening</option>
            </select>
          </div>
        </div>
      </div>

      {/* Walk-in Donors Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Walk-in Donations Record
            </h2>
            <span className="text-xs text-slate-400 font-normal">
              ({filteredDonors.length} of {walkinDonors.length} entries)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Showing separate walk-in queue
          </span>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-3">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Walk-in Donors Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No walk-in records match the current filter or search criteria. Try adjusting the search or click below to register a walk-in donor.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Walk-in Donor</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Token & Date</th>
                  <th className="py-3.5 px-4">Donor Name & Vitals</th>
                  <th className="py-3.5 px-4">CNIC (Formatted)</th>
                  <th className="py-3.5 px-4">Phone (Formatted)</th>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Center & Bag #</th>
                  <th className="py-3.5 px-4">Status & Units</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDonors.map(donor => {
                  const formattedCnic = formatCNIC(donor.cnic);
                  const formattedPhoneNum = formatPhone(donor.phone);

                  return (
                    <tr
                      key={donor.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Token & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-red-600">
                          {donor.tokenNumber || 'WALK-IN'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(donor.walkinDate || donor.createdAt)}</span>
                        </div>
                      </td>

                      {/* Donor Name & Vitals */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {donor.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{donor.age} yrs</span>
                          <span>·</span>
                          <span>{donor.gender}</span>
                          {donor.hemoglobin && (
                            <>
                              <span>·</span>
                              <span className="text-slate-700 font-medium">
                                Hb: {donor.hemoglobin} g/dL
                              </span>
                            </>
                          )}
                          {donor.weight && (
                            <>
                              <span>·</span>
                              <span>{donor.weight} kg</span>
                            </>
                          )}
                        </div>
                        {donor.referredPatient && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            Ref: {donor.referredPatient}
                          </div>
                        )}
                      </td>

                      {/* CNIC (Formatted) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-900 font-semibold tracking-wider">
                            {formattedCnic || '—'}
                          </span>
                          {formattedCnic && (
                            <button
                              onClick={() => copyToClipboard(formattedCnic, `cnic-${donor.id}`)}
                              title="Copy CNIC"
                              className="text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {copiedId === `cnic-${donor.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">National ID</span>
                      </td>

                      {/* Phone (Formatted) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-900 font-medium">
                            {formattedPhoneNum || '—'}
                          </span>
                          {formattedPhoneNum && (
                            <button
                              onClick={() => copyToClipboard(formattedPhoneNum, `ph-${donor.id}`)}
                              title="Copy Phone"
                              className="text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {copiedId === `ph-${donor.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${formattedPhoneNum.replace(/\D/g, '')}`}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                          <span>·</span>
                          <a
                            href={getWhatsAppUrl(formattedPhoneNum, donor.name, donor.bloodGroup)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white font-bold text-xs shadow-xs">
                          {donor.bloodGroup}
                        </span>
                      </td>

                      {/* Center & Bag # */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-800 font-medium truncate max-w-[180px]">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{donor.centerName || 'Main Center'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {donor.bagNumber ? `Bag: ${donor.bagNumber}` : donor.city}
                        </div>
                      </td>

                      {/* Status & Units */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {donor.status === 'Donated' ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Donated ({donor.unitsDonated || 1} unit)</span>
                          </div>
                        ) : donor.status === 'Deferred' ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Deferred</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Screening</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPrintSlip(donor)}
                            title="Print Walk-in Donor Slip"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDonor(donor)}
                            title="Edit Walk-in Donor"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDonor(donor.id)}
                            title="Delete Record"
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
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
  );
};
