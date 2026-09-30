import React, { useState, useEffect } from 'react';
import { Heart, Stethoscope, Users, UserCheck } from 'lucide-react';
import { subscribeToDonors } from '../lib/donors';
import { DonorData } from '../lib/types';

export const CounterStats: React.FC = () => {
  const [donors, setDonors] = useState<DonorData[]>([]);

  useEffect(() => {
    const unsub = subscribeToDonors((data) => {
      setDonors(data);
    });
    return () => unsub();
  }, []);

  const totalDonors = donors.length;
  const walkinDonors = donors.filter(d => d.donorType === 'walkin').length;
  const donatedCount = donors.filter(d => d.status === 'Donated').length;

  const stats = [
    {
      icon: Users,
      number: totalDonors > 0 ? `${totalDonors}` : '0',
      label: 'Live Registered Donors',
      highlight: true
    },
    {
      icon: UserCheck,
      number: walkinDonors > 0 ? `${walkinDonors}` : '0',
      label: 'Walk-in Donors Recorded',
      highlight: false
    },
    {
      icon: Heart,
      number: donatedCount > 0 ? `${donatedCount}` : '250+',
      label: donatedCount > 0 ? 'Donated & Verified Bags' : 'Target Camp Bags',
      highlight: false
    },
    {
      icon: Stethoscope,
      number: '100%',
      label: 'Free Spot Screening & Vitals',
      highlight: false
    }
  ];

  return (
    <section className="py-6 sm:py-8 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-center">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div 
                key={idx} 
                className={`p-3 sm:p-4 rounded-xs border transition-all flex flex-col items-center justify-center ${
                  s.highlight 
                    ? 'bg-red-50/40 border-red-200 shadow-2xs' 
                    : 'bg-gray-50/60 border-gray-100 shadow-2xs hover:border-red-200'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 text-[#ea3a3c] flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
                </div>
                <div className="font-heading font-bold text-lg sm:text-2xl text-[#ea3a3c] mb-0.5 tabular-nums">
                  {s.number}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-gray-700 leading-tight">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
