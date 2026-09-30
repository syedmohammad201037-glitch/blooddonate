import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Copy,
  Check,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { Donor, BloodGroup, DonorStatus, DonorType } from '../types/donor';
import { formatCNIC, formatPhone, formatDate, getWhatsAppUrl } from '../utils/formatters';

interface AdminConsoleProps {
  donors: Donor[];
  onOpenAddModal: (type: DonorType) => void;
  onEditDonor: (donor: Donor) => void;
  onDeleteDonor: (id: string) => void;
  onPrintSlip: (donor: Donor) => void;
  onQuickStatusChange: (donor: Donor, newStatus: DonorStatus) => void;
  lastUpdatedDonorId?: string | null;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  donors,
  onOpenAddModal,
  onEditDonor,
  onDeleteDonor,
  onPrintSlip,
  onQuickStatusChange,
  lastUpdatedDonorId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'walkin' | 'regular'>('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'updatedAt' | 'bloodGroup'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const cities = useMemo(() => {
    return Array.from(new Set(donors.map(d => d.city).filter(Boolean))).sort();
  }, [donors]);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredDonors = useMemo(() => {
    return donors.filter(donor => {
      const formattedCnic = formatCNIC(donor.cnic);
      const formattedPh = formatPhone(donor.phone);
      const matchesSearch =
        !searchTerm ||
        donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedCnic.includes(searchTerm) ||
        formattedPh.includes(searchTerm) ||
        (donor.tokenNumber && donor.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (donor.centerName && donor.centerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        donor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donor.bagNumber && donor.bagNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'all' || donor.donorType === typeFilter;
      const matchesBg = bloodGroupFilter === 'all' || donor.bloodGroup === bloodGroupFilter;
      const matchesStatus = statusFilter === 'all' || donor.status === statusFilter;
      const matchesCity = cityFilter === 'all' || donor.city === cityFilter;

      return matchesSearch && matchesType && matchesBg && matchesStatus && matchesCity;
    }).sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortField === 'bloodGroup') {
        return sortDirection === 'asc' ? a.bloodGroup.localeCompare(b.bloodGroup) : b.bloodGroup.localeCompare(a.bloodGroup);
      }
      // default: updatedAt or createdAt
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [donors, searchTerm, typeFilter, bloodGroupFilter, statusFilter, cityFilter, sortField, sortDirection]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Donor ID',
      'Name',
      'Type',
      'Blood Group',
      'CNIC (Formatted)',
      'Phone (Formatted)',
      'City',
      'Status',
      'Token Number',
      'Center',
      'Units Donated',
      'Hemoglobin (g/dL)',
      'Weight (kg)',
      'Bag #',
      'Last Donated',
      'Updated At',
    ];

    const rows = filteredDonors.map(d => [
      d.id,
      `"${d.name.replace(/"/g, '""')}"`,
      d.donorType.toUpperCase(),
      d.bloodGroup,
      `"${formatCNIC(d.cnic)}"`,
      `"${formatPhone(d.phone)}"`,
      `"${d.city}"`,
      d.status,
      d.tokenNumber || '',
      `"${(d.centerName || '').replace(/"/g, '""')}"`,
      d.unitsDonated ?? (d.status === 'Donated' ? 1 : 0),
      d.hemoglobin ?? '',
      d.weight ?? '',
      d.bagNumber ?? '',
      d.lastDonationDate || '',
      d.updatedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hayat_donors_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Admin Donor Management Console
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Centralized record management. CNIC and phone formats are strictly enforced.
              All updates update immediately across the system without localStorage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => onOpenAddModal('walkin')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Walk-in Donor</span>
            </button>
            <button
              onClick={() => onOpenAddModal('regular')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Regular Donor</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, formatted CNIC (XXXXX-XXXXXXX-X), phone, token..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Donor Types</option>
              <option value="walkin">Walk-in Donors</option>
              <option value="regular">Regular Donors</option>
            </select>
          </div>

          {/* Blood Group Filter */}
          <div className="lg:col-span-2">
            <select
              value={bloodGroupFilter}
              onChange={e => setBloodGroupFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Blood Groups</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Donated">Donated</option>
              <option value="Deferred">Deferred</option>
              <option value="Pending Screening">Pending Screening</option>
            </select>
          </div>

          {/* City Filter */}
          <div className="lg:col-span-2">
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Admin Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-900">
              Admin Registry Master View
            </span>
            <span className="text-xs text-slate-500">
              ({filteredDonors.length} records found)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Sort by:</span>
            <button
              onClick={() => {
                if (sortField === 'name') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                else { setSortField('name'); setSortDirection('asc'); }
              }}
              className={`flex items-center gap-1 hover:text-slate-900 ${sortField === 'name' ? 'font-bold text-slate-900' : ''}`}
            >
              Name <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (sortField === 'updatedAt') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                else { setSortField('updatedAt'); setSortDirection('desc'); }
              }}
              className={`flex items-center gap-1 hover:text-slate-900 ${sortField === 'updatedAt' ? 'font-bold text-slate-900' : ''}`}
            >
              Recent <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No donors match the applied filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Donor Name & Type</th>
                  <th className="py-3.5 px-4">CNIC (Formatted: XXXXX-XXXXXXX-X)</th>
                  <th className="py-3.5 px-4">Phone (Formatted: 03XX-XXXXXXX)</th>
                  <th className="py-3.5 px-4 text-center">Group</th>
                  <th className="py-3.5 px-4">Location / Center</th>
                  <th className="py-3.5 px-4">Status & Quick Toggle</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDonors.map(donor => {
                  const formattedCnic = formatCNIC(donor.cnic);
                  const formattedPhoneNum = formatPhone(donor.phone);
                  const isRecentlyUpdated = lastUpdatedDonorId === donor.id;

                  return (
                    <tr
                      key={donor.id}
                      className={`transition-colors ${
                        isRecentlyUpdated
                          ? 'bg-amber-50/80 ring-2 ring-amber-400/50'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Name & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {donor.name}
                          </span>
                          {isRecentlyUpdated && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[10px] font-bold rounded animate-pulse">
                              <Sparkles className="w-2.5 h-2.5" /> Updated
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] mt-0.5">
                          {donor.donorType === 'walkin' ? (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                              WALK-IN {donor.tokenNumber ? `· ${donor.tokenNumber}` : ''}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                              REGULAR VOLUNTARY
                            </span>
                          )}
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">
                            {donor.gender}, {donor.age} yrs
                          </span>
                        </div>
                      </td>

                      {/* CNIC (Formatted) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-900 font-bold tracking-wider text-xs bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                            {formattedCnic || '—'}
                          </span>
                          {formattedCnic && (
                            <button
                              onClick={() => copyToClipboard(formattedCnic, `admin-cnic-${donor.id}`)}
                              title="Copy Formatted CNIC"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedId === `admin-cnic-${donor.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          13-digit Pakistani CNIC
                        </div>
                      </td>

                      {/* Phone (Formatted) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-900 font-bold text-xs bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                            {formattedPhoneNum || '—'}
                          </span>
                          {formattedPhoneNum && (
                            <button
                              onClick={() => copyToClipboard(formattedPhoneNum, `admin-ph-${donor.id}`)}
                              title="Copy Formatted Phone"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedId === `admin-ph-${donor.id}` ? (
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
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white font-extrabold text-xs shadow-xs">
                          {donor.bloodGroup}
                        </span>
                      </td>

                      {/* Location / Center */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {donor.city}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {donor.centerName || donor.address || 'Central Database'}
                        </div>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={donor.status}
                          onChange={e => onQuickStatusChange(donor, e.target.value as DonorStatus)}
                          className={`px-2 py-1 text-[11px] font-semibold rounded border cursor-pointer focus:outline-none ${
                            donor.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : donor.status === 'Donated'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : donor.status === 'Deferred'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Available">Available</option>
                          <option value="Donated">Donated</option>
                          <option value="Deferred">Deferred</option>
                          <option value="Pending Screening">Pending Screening</option>
                        </select>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {donor.donorType === 'walkin' && donor.unitsDonated
                            ? `${donor.unitsDonated} unit(s) collected`
                            : `Updated: ${formatDate(donor.updatedAt || donor.createdAt)}`}
                        </div>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {donor.donorType === 'walkin' && (
                            <button
                              onClick={() => onPrintSlip(donor)}
                              title="Print Walk-in Receipt / Card"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditDonor(donor)}
                            title="Edit Donor (Live Corrected Update)"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => onDeleteDonor(donor.id)}
                            title="Delete Donor Record"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
