import React from 'react';
import { UserCheck, Users, Droplets, AlertCircle, HeartHandshake } from 'lucide-react';
import { Donor, BloodGroup } from '../types/donor';

interface StatsCardsProps {
  donors: Donor[];
  onSelectFilter?: (bloodGroup?: BloodGroup, type?: 'regular' | 'walkin') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ donors }) => {
  const walkinCount = donors.filter(d => d.donorType === 'walkin').length;
  const regularCount = donors.filter(d => d.donorType === 'regular').length;
  const availableRegular = donors.filter(d => d.donorType === 'regular' && d.status === 'Available').length;
  const totalUnits = donors.reduce((sum, d) => sum + (d.unitsDonated || (d.status === 'Donated' ? 1 : 0)), 0);
  const deferredCount = donors.filter(d => d.status === 'Deferred').length;

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const bloodInventory = bloodGroups.map(bg => ({
    group: bg,
    count: donors.filter(d => d.bloodGroup === bg && (d.status === 'Available' || d.status === 'Donated')).length,
    walkins: donors.filter(d => d.bloodGroup === bg && d.donorType === 'walkin').length,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Walk-in Donors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 tracking-wide">
              Walk-in Donations
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {walkinCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">on-site visits</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Direct center donations & hospital referrals
          </p>
        </div>

        {/* Card 2: Regular Voluntary Donors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 tracking-wide">
              Registered Voluntary
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {regularCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {availableRegular} available on call
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Emergency database contacts across cities
          </p>
        </div>

        {/* Card 3: Blood Units Collected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 tracking-wide">
              Total Units Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalUnits}
            </span>
            <span className="text-xs text-slate-500 font-medium">bags processed</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Screened and stored in transfusion bags
          </p>
        </div>

        {/* Card 4: Screenings & Deferrals */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 tracking-wide">
              Medical Deferrals
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {deferredCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">temporary deferred</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Low Hb, weight or recent medication
          </p>
        </div>
      </div>

      {/* Blood Group Quick Distribution Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Blood Group Inventory & Donor Registry Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {donors.length} total registered records
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {bloodInventory.map(item => (
            <div
              key={item.group}
              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-red-50/50 hover:border-red-200 transition-colors text-center"
            >
              <div className="inline-block px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-xs">
                {item.group}
              </div>
              <div className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                {item.count}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {item.walkins} walk-in
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
