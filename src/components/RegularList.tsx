import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  MapPin,
  Heart,
  Copy,
  Check,
  Users,
} from 'lucide-react';
import { Donor, BloodGroup } from '../types/donor';
import { formatCNIC, formatPhone, formatDate, getWhatsAppUrl } from '../utils/formatters';

interface RegularListProps {
  donors: Donor[];
  onOpenAddModal: () => void;
  onEditDonor: (donor: Donor) => void;
  onDeleteDonor: (id: string) => void;
}

export const RegularList: React.FC<RegularListProps> = ({
  donors,
  onOpenAddModal,
  onEditDonor,
  onDeleteDonor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter only regular voluntary donors
  const regularDonors = useMemo(() => {
    return donors.filter(d => d.donorType === 'regular');
  }, [donors]);

  // Unique cities list
  const cities = useMemo(() => {
    const list = Array.from(new Set(regularDonors.map(d => d.city).filter(Boolean)));
    return list.sort();
  }, [regularDonors]);

  const filteredDonors = useMemo(() => {
    return regularDonors.filter(donor => {
      const formattedCnic = formatCNIC(donor.cnic);
      const formattedPh = formatPhone(donor.phone);
      const searchMatch =
        !searchTerm ||
        donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedCnic.includes(searchTerm) ||
        formattedPh.includes(searchTerm) ||
        donor.city.toLowerCase().includes(searchTerm.toLowerCase());

      const bgMatch = selectedBloodGroup === 'all' || donor.bloodGroup === selectedBloodGroup;
      const cityMatch = selectedCity === 'all' || donor.city === selectedCity;

      return searchMatch && bgMatch && cityMatch;
    });
  }, [regularDonors, searchTerm, selectedBloodGroup, selectedCity]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Voluntary Network
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Regular & Emergency Blood Donors
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Community donors on standby for emergency transfusions and thalassemia patients.
            </p>
          </div>

          <div>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Register Voluntary Donor</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search regular donors by name, formatted CNIC or phone, city..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedBloodGroup}
              onChange={e => setSelectedBloodGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="all">All Blood Groups</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>
                  Group: {bg}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
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

      {/* Grid of Regular Donors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDonors.map(donor => {
          const formattedCnic = formatCNIC(donor.cnic);
          const formattedPhoneNum = formatPhone(donor.phone);

          return (
            <div
              key={donor.id}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {donor.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{donor.city}</span>
                      <span>·</span>
                      <span>{donor.age} yrs</span>
                      <span>·</span>
                      <span>{donor.gender}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 text-white font-bold text-xs shadow-xs shrink-0">
                    {donor.bloodGroup}
                  </div>
                </div>

                {/* Formatted CNIC & Phone */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">CNIC:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-900 font-semibold">
                        {formattedCnic || '—'}
                      </span>
                      {formattedCnic && (
                        <button
                          onClick={() => copyToClipboard(formattedCnic, `cnic-${donor.id}`)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === `cnic-${donor.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-900 font-semibold">
                        {formattedPhoneNum || '—'}
                      </span>
                      {formattedPhoneNum && (
                        <button
                          onClick={() => copyToClipboard(formattedPhoneNum, `ph-${donor.id}`)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === `ph-${donor.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Last Donated:</span>
                    <span>{formatDate(donor.lastDonationDate)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Status:</span>
                    {donor.status === 'Available' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                        <Clock className="w-3 h-3" /> Donated Recently
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${formattedPhoneNum.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                  <a
                    href={getWhatsAppUrl(formattedPhoneNum, donor.name, donor.bloodGroup)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditDonor(donor)}
                    title="Edit Donor"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteDonor(donor.id)}
                    title="Delete Donor"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDonors.length === 0 && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No Regular Donors Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or add a new voluntary donor.
          </p>
        </div>
      )}
    </div>
  );
};
