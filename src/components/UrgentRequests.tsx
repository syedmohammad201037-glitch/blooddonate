import React from 'react';
import { AlertTriangle, MapPin, Phone, MessageSquare, HeartHandshake } from 'lucide-react';
import { Donor, BloodGroup } from '../types/donor';
import { formatPhone, getWhatsAppUrl } from '../utils/formatters';

interface UrgentRequestsProps {
  donors: Donor[];
  onSelectDonorForEmergency: (donor: Donor) => void;
}

interface UrgentCase {
  id: string;
  patientName: string;
  hospital: string;
  city: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: 'Critical' | 'Urgent' | 'Standard';
  caseType: string;
  contactPerson: string;
  contactPhone: string;
}

export const UrgentRequests: React.FC<UrgentRequestsProps> = ({ donors }) => {
  const urgentCases: UrgentCase[] = [
    {
      id: 'urg-1',
      patientName: 'Child Zainab (Age 4)',
      hospital: 'National Institute of Child Health (NICH)',
      city: 'Karachi',
      bloodGroup: 'O-',
      unitsNeeded: 2,
      urgency: 'Critical',
      caseType: 'Thalassemia Major Transfusion',
      contactPerson: 'Dr. Asim Farooq',
      contactPhone: '0300-9876543',
    },
    {
      id: 'urg-2',
      patientName: 'Shahid Mehmood',
      hospital: 'Services Hospital ICU',
      city: 'Lahore',
      bloodGroup: 'A-',
      unitsNeeded: 3,
      urgency: 'Critical',
      caseType: 'Road Traffic Accident Surgery',
      contactPerson: 'Surgical Resident Dr. Tariq',
      contactPhone: '0321-7654321',
    },
    {
      id: 'urg-3',
      patientName: 'Rubina Bibi',
      hospital: 'PIMS Hospital Gyne Ward',
      city: 'Islamabad',
      bloodGroup: 'B-',
      unitsNeeded: 2,
      urgency: 'Urgent',
      caseType: 'C-Section Emergency',
      contactPerson: 'Duty Nurse Shaheen',
      contactPhone: '0333-8877665',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Urgent Blood Requirements & Match Finder
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active patient emergency requests matched against registered voluntary & available walk-in donors.
            </p>
          </div>
        </div>
      </div>

      {/* Cases list */}
      <div className="space-y-4">
        {urgentCases.map(urgCase => {
          // Find matching available donors
          const matchingDonors = donors.filter(
            d => d.bloodGroup === urgCase.bloodGroup && (d.status === 'Available' || d.donorType === 'regular')
          );

          return (
            <div
              key={urgCase.id}
              className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {urgCase.bloodGroup}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {urgCase.patientName}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        {urgCase.urgency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{urgCase.hospital}, {urgCase.city}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">{urgCase.caseType}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">
                    Units Needed: <span className="text-red-600 font-extrabold text-sm">{urgCase.unitsNeeded}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Contact: {urgCase.contactPerson} ({formatPhone(urgCase.contactPhone)})
                  </div>
                </div>
              </div>

              {/* Matched Donors Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>Matched Donors in Registry ({matchingDonors.length} available)</span>
                  </div>
                </div>

                {matchingDonors.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    No immediate match in {urgCase.city}. Alerting emergency blood donor coordinator...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {matchingDonors.map(donor => {
                      const formattedPh = formatPhone(donor.phone);
                      return (
                        <div
                          key={donor.id}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {donor.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                              {formattedPh} · {donor.city}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {donor.donorType === 'walkin' ? 'Walk-in donor' : 'Regular donor'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${formattedPh.replace(/\D/g, '')}`}
                              className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              title="Call Donor"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={getWhatsAppUrl(formattedPh, donor.name, donor.bloodGroup)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
