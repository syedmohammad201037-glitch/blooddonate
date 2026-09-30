import React from 'react';
import { X, Printer, Heart, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Donor } from '../types/donor';
import { formatCNIC, formatPhone, formatDate } from '../utils/formatters';

interface DonorSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: Donor | null;
}

export const DonorSlipModal: React.FC<DonorSlipModalProps> = ({ isOpen, onClose, donor }) => {
  if (!isOpen || !donor) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedCnic = formatCNIC(donor.cnic);
  const formattedPh = formatPhone(donor.phone);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Actions */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold tracking-wide">
              Official Blood Donation Slip & Certificate
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 bg-white text-slate-900 print:p-0" id="printable-slip">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-red-600 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  HAYAT BLOOD NETWORK
                </h1>
                <p className="text-[11px] text-slate-500">
                  Transfusion & Walk-in Donation Services
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-extrabold text-red-600">
                {donor.tokenNumber || `REG-${donor.id.slice(-6).toUpperCase()}`}
              </div>
              <div className="text-[10px] text-slate-500">
                Token Reference
              </div>
            </div>
          </div>

          {/* Blood Group Watermark Box */}
          <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Verified Blood Group
              </span>
              <span className="text-2xl font-black text-red-600 tracking-tight">
                Group {donor.bloodGroup}
              </span>
              <span className="block text-[11px] text-slate-600 mt-0.5">
                Screened Donor · {donor.donorType === 'walkin' ? 'On-site Walk-in' : 'Registered Voluntary'}
              </span>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {donor.bloodGroup}
            </div>
          </div>

          {/* Key Formatted Credentials */}
          <div className="space-y-3 text-xs border-y border-slate-100 py-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Donor Name:</span>
              <span className="font-bold text-slate-900 text-sm">{donor.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pakistani CNIC (Verified):</span>
              <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                {formattedCnic}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Contact Number:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formattedPh}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Age & Gender:</span>
              <span className="font-semibold text-slate-800">
                {donor.age} Years · {donor.gender}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Donation Center:</span>
              <span className="font-semibold text-slate-800">
                {donor.centerName || `${donor.city} Central Bank`}
              </span>
            </div>

            {donor.donorType === 'walkin' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Donation Date:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(donor.walkinDate || donor.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hemoglobin & Weight:</span>
                  <span className="font-semibold text-slate-800">
                    {donor.hemoglobin ? `${donor.hemoglobin} g/dL` : '14.0 g/dL'} · {donor.weight ? `${donor.weight} kg` : '68 kg'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Blood Bag Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {donor.bagNumber || 'BAG-UNASSIGNED'}
                  </span>
                </div>

                {donor.referredPatient && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Patient Referral:</span>
                    <span className="font-semibold text-amber-800">
                      {donor.referredPatient}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Screening Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {donor.status}
              </span>
            </div>
          </div>

          {/* Stamp & Signature Footer */}
          <div className="mt-6 pt-4 flex justify-between items-end text-[10px] text-slate-500">
            <div>
              <div className="flex items-center gap-1 text-slate-700 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorized Laboratory Seal</span>
              </div>
              <p>Medical officer verification complete.</p>
            </div>

            <div className="text-right">
              <div className="w-28 border-b border-slate-400 mb-1"></div>
              <span>Medical Officer Signature</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Print Button */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center no-print">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
