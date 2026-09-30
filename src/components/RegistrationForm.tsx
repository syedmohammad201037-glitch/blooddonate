import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, Printer, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { registerDonor, DonorData, subscribeToBloodGroupSetting, getAllowAllBloodGroups } from '../lib/firebase';

export const RegistrationForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [allowAllBloodGroups, setAllowAllBloodGroups] = useState(getAllowAllBloodGroups());

  useEffect(() => {
    const unsub = subscribeToBloodGroupSetting((val) => {
      setAllowAllBloodGroups(val);
    });
    return () => unsub();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredDonor, setRegisteredDonor] = useState<DonorData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pakistani CNIC formatter: 42101-XXXXXXX-X
  const handleCnicChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    }
    setCnic(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setErrorMessage("Please enter a valid active phone number.");
      return;
    }
    if (!cnic.trim() || cnic.replace(/\D/g, '').length < 13) {
      setErrorMessage("Please enter your 13-digit CNIC number.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Please enter your residential address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerDonor({
        name: name.trim(),
        phone: phone.trim(),
        cnic: cnic.trim(),
        address: address.trim(),
        bloodGroup: bloodGroup || 'Unknown'
      });

      if (res.success && res.data) {
        setRegisteredDonor(res.data);
      } else {
        setErrorMessage(res.message || res.error || "Registration failed.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleReset = () => {
    setRegisteredDonor(null);
    setName('');
    setPhone('');
    setCnic('');
    setAddress('');
    setBloodGroup('Unknown');
    setErrorMessage(null);
  };

  return (
    <section id="register-section" className="py-12 bg-gray-50 border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
            Donor Registration Form
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Please fill in your details below. No account or password required.
          </p>
        </div>

        {/* Success Confirmation Token Slip */}
        {registeredDonor ? (
          <div 
            id="printable-slip"
            className="bg-white rounded-xl border-2 border-red-700 p-6 sm:p-8 shadow-sm space-y-5"
          >
            <div className="text-center pb-4 border-b border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Registration Successful!</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Your entry has been recorded in the database.
              </p>
            </div>

            {/* Token */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider block">
                Registration Token Number
              </span>
              <span className="font-mono text-3xl font-black text-red-800">
                {registeredDonor.tokenNumber}
              </span>
            </div>

            {/* Details Table */}
            <div className="bg-gray-50 rounded-lg p-4 text-xs sm:text-sm space-y-2 border border-gray-200">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Name:</span>
                <span className="font-bold text-gray-900">{registeredDonor.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Phone:</span>
                <span className="font-semibold text-gray-900">{registeredDonor.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-medium">CNIC:</span>
                <span className="font-mono font-medium text-gray-900">{registeredDonor.cnic}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Blood Group:</span>
                <span className="font-bold text-red-700">{registeredDonor.bloodGroup}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-medium">Address:</span>
                <span className="font-medium text-gray-900 text-right max-w-xs">{registeredDonor.address}</span>
              </div>
            </div>

            {/* Event Reminder */}
            <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <Calendar className="w-4 h-4 text-red-700" />
                <span>Sunday, October 4, 2026 (10:00 AM to 6:00 PM)</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="w-4 h-4 text-red-700" />
                <span>Madina Colony, Scheme 33 Cantonment</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="no-print pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePrintSlip}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Token Slip</span>
              </button>
              <button
                onClick={handleReset}
                className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs sm:text-sm rounded-lg cursor-pointer"
              >
                Register Another Person
              </button>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-xs">
            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Name <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Phone <span className="text-red-700">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700"
                />
              </div>

              {/* CNIC */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  CNIC <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="42101-XXXXXXX-X"
                  value={cnic}
                  onChange={(e) => handleCnicChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-mono focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Address <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="House / Street, Madina Colony, Scheme 33 Cantonment"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700 cursor-pointer"
                >
                  <option value="Unknown">Unknown (Spot Screening Test at Camp)</option>
                  {allowAllBloodGroups && (
                    <>
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                    </>
                  )}
                </select>
                {!allowAllBloodGroups && (
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">
                    * Blood group screening will be performed free of cost by doctors at the camp.
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-sm sm:text-base rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Saving your registration...</span>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Submit Donor Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};
