import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  CheckCircle2, 
  Printer, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Download, 
  Share2, 
  Search, 
  Copy, 
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  registerDonor, 
  findDonorByTokenOrPhone, 
  DonorData, 
  FormFieldConfig,
  subscribeToFormFields,
  DEFAULT_FORM_FIELDS 
} from '../lib/firebase';
import { formatPhoneInput } from '../lib/security';
import volunteerCampImg from '../assets/images/volunteer_camp_real.jpg';

export const RegistrationAndHelpfulInfo: React.FC = () => {
  // Mode: 'register' | 'track'
  const [activeTab, setActiveTab] = useState<'register' | 'track'>('register');

  // Dynamic Form Configuration controlled by Admin
  const [formFields, setFormFields] = useState<FormFieldConfig[]>(DEFAULT_FORM_FIELDS);

  // Form State Values Map: { [fieldId]: value }
  const [formValues, setFormValues] = useState<Record<string, string>>({
    name: '',
    phone: '',
    cnic: '',
    address: '',
    bloodGroup: 'O+'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredDonor, setRegisteredDonor] = useState<DonorData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tracking State
  const [trackingInput, setTrackingInput] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedDonor, setTrackedDonor] = useState<DonorData | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);
  const trackedSlipRef = useRef<HTMLDivElement>(null);

  // Subscribe to dynamic form fields schema controlled by admin
  useEffect(() => {
    const unsub = subscribeToFormFields((fields) => {
      const activeFields = fields
        .filter(f => f.enabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setFormFields(activeFields.length > 0 ? activeFields : DEFAULT_FORM_FIELDS);
    });
    return () => unsub();
  }, []);

  // Listen to hash changes for deep linking
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search.toLowerCase();
        if (hash.includes('track') || search.includes('track')) {
          setActiveTab('track');
        } else if (hash.includes('register')) {
          setActiveTab('register');
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Format Pakistani CNIC automatically
  const handleCnicChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    }
    setFormValues(prev => ({ ...prev, cnic: formatted }));
  };

  const handleInputChange = (fieldId: string, val: string) => {
    if (fieldId === 'cnic') {
      handleCnicChange(val);
    } else if (fieldId === 'phone') {
      setFormValues(prev => ({ ...prev, phone: formatPhoneInput(val) }));
    } else {
      setFormValues(prev => ({ ...prev, [fieldId]: val }));
    }
  };

  // Helper to reliably get value with select fallback
  const getFieldValue = (field: FormFieldConfig): string => {
    if (formValues[field.id] !== undefined && formValues[field.id] !== '') {
      return formValues[field.id];
    }
    if (field.type === 'select' && field.options && field.options.length > 0) {
      return field.options[0];
    }
    return '';
  };

  // Submit new registration with dynamic fields
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate required fields
    for (const field of formFields) {
      if (field.required) {
        const val = getFieldValue(field);
        if (!val || !val.toString().trim()) {
          setErrorMessage(`Please fill out required field: "${field.label}"`);
          return;
        }
      }
    }

    const name = (formValues.name || '').trim();
    const phone = (formValues.phone || '').trim();
    const cnic = (formValues.cnic || '').trim();
    const address = (formValues.address || '').trim();
    const bloodGroup = formValues.bloodGroup || 'O+';

    if (!name) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone || phoneDigits.length < 10) {
      setErrorMessage("Please enter an active 11-digit contact / WhatsApp phone number (e.g. 0300-1234567).");
      return;
    }

    const cnicDigits = cnic.replace(/\D/g, '');
    if (cnic && cnicDigits.length > 0 && cnicDigits.length !== 13) {
      setErrorMessage("CNIC number must be exactly 13 digits (e.g. 42101-1234567-1).");
      return;
    }

    if (!address) {
      setErrorMessage("Please enter your Residential Address / Area.");
      return;
    }

    // Collect custom fields added by admin
    const customFields: Record<string, any> = {};
    formFields.forEach(f => {
      if (!['name', 'phone', 'cnic', 'address', 'bloodGroup'].includes(f.id)) {
        const value = getFieldValue(f);
        customFields[f.id] = value;
        customFields[f.label] = value;
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
        donorType: 'regular',
        customFields
      });

      if (res && res.success && res.data) {
        setRegisteredDonor(res.data);
        setErrorMessage(null);
      } else {
        setErrorMessage((res as any)?.error || res?.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMessage(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // STRICT TRACK SEARCH: Must be full exact token (e.g. BDC-4891), full phone, or full 13-digit CNIC
  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError(null);
    setTrackedDonor(null);

    const raw = trackingInput.trim();
    if (!raw) {
      setTrackingError("Please enter your complete Token Number (e.g. BDC-1234), Phone number, or CNIC.");
      return;
    }

    const clean = raw.toLowerCase().replace(/\s+/g, '');
    const cleanDigits = raw.replace(/\D/g, '');
    const tokenSuffix = clean.replace(/^bdc-?/, '');

    // Prevent searching if only "BDC" or "BDC-" is entered without a token number
    if (clean === 'bdc' || clean === 'bdc-' || (clean.startsWith('bdc') && tokenSuffix.length === 0)) {
      setTrackingError("Pura token number likhein (e.g. BDC-1234). Sirf 'BDC' likhne se token search nahi hoga.");
      return;
    }

    if (clean.length < 3) {
      setTrackingError("Pura token number likhein (e.g. BDC-1234), Phone number, ya CNIC.");
      return;
    }

    setIsTracking(true);

    try {
      const found = await findDonorByTokenOrPhone(raw);
      if (found) {
        setTrackedDonor(found);
      } else {
        setTrackingError("No record found. Please enter your complete Token Number (e.g. BDC-1234), registered Phone, or 13-digit CNIC.");
      }
    } catch (err: any) {
      setTrackingError("Could not look up token. Please try again.");
    } finally {
      setIsTracking(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  // Print Slip
  const handlePrintSlip = (donorToPrint: DonorData) => {
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Donor Slip - ${donorToPrint.tokenNumber}</title>
            <style>
              body { font-family: 'Open Sans', system-ui, sans-serif; padding: 20px; color: #1a202c; margin: 0; }
              .header { text-align: center; border-bottom: 2px solid #ea3a3c; padding-bottom: 12px; margin-bottom: 16px; }
              .token-box { background: #fef2f2; border: 1px solid #fecaca; padding: 12px; text-align: center; margin-bottom: 16px; border-radius: 4px; }
              .token-num { font-size: 26px; font-weight: bold; color: #991b1b; font-family: monospace; }
              .status-badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: bold; border-radius: 12px; background: #e2e8f0; color: #334155; margin-top: 6px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
              td.label { color: #64748b; font-weight: 600; width: 35%; }
              td.val { font-weight: bold; color: #0f172a; word-break: break-word; }
              .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; font-size: 12px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin:0; color:#ea3a3c;">BLOOD DONATION CAMP 2026</h2>
              <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Jamaat-e-Islami, Madina Colony Ward 10 & Scheme 33 Cantonment</p>
            </div>
            <div class="token-box">
              <div style="font-size:11px; text-transform:uppercase; color:#ea3a3c; font-weight:bold;">OFFICIAL DONOR ENTRY TOKEN</div>
              <div class="token-num">${donorToPrint.tokenNumber}</div>
              <div class="status-badge">Status: ${donorToPrint.status || 'Registered'}</div>
            </div>
            <table>
              <tr><td class="label">Donor Name:</td><td class="val">${donorToPrint.name}</td></tr>
              <tr><td class="label">Blood Group:</td><td class="val" style="color:#ea3a3c;">${donorToPrint.bloodGroup}</td></tr>
              <tr><td class="label">Contact Phone:</td><td class="val">${donorToPrint.phone}</td></tr>
              <tr><td class="label">CNIC Number:</td><td class="val">${donorToPrint.cnic}</td></tr>
              <tr><td class="label">Address:</td><td class="val">${donorToPrint.address}</td></tr>
              <tr><td class="label">Camp Date:</td><td class="val">Sunday, October 4, 2026 (10:00 AM - 6:00 PM)</td></tr>
              <tr><td class="label">Venue:</td><td class="val">Madina Colony, Scheme 33 Cantonment, Karachi</td></tr>
            </table>
            <div class="info-box">
              <strong>Instructions:</strong> Present this token at the registration desk on Sunday, Oct 4, 2026. Drink plenty of water and bring your original CNIC.
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

  // PDF Export
  const handleExportPdf = async (targetRef: React.RefObject<HTMLDivElement | null>, donorToExport: DonorData) => {
    setIsGeneratingPdf(true);

    try {
      if (targetRef.current) {
        const canvas = await html2canvas(targetRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a5'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 5, pdfWidth, Math.min(pdfHeight, 195));
        pdf.save(`Donor_Token_${donorToExport.tokenNumber || 'Slip'}.pdf`);
      } else {
        handlePrintSlip(donorToExport);
      }
    } catch (err) {
      console.error("PDF generation fallback", err);
      handlePrintSlip(donorToExport);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleResetRegistration = () => {
    setRegisteredDonor(null);
    setFormValues({
      name: '',
      phone: '',
      cnic: '',
      address: '',
      bloodGroup: 'O+'
    });
    setErrorMessage(null);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Confirmed':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-600',
          title: 'Confirmed & Pre-Screened',
          desc: 'Your token is verified for camp admission.'
        };
      case 'Donated':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
          title: 'Blood Donated Successfully',
          desc: 'JazakAllah Khair! You saved a precious life.'
        };
      case 'Deferred':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
          title: 'Temporarily Deferred',
          desc: 'Medical team advised temporary rest.'
        };
      default:
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          dot: 'bg-[#ea3a3c]',
          title: 'Registered & Active',
          desc: 'Your entry is recorded. Please report on Oct 4, 2026.'
        };
    }
  };

  return (
    <section id="register-section" className="py-8 sm:py-12 lg:py-14 bg-gray-50 border-t border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Blood Camp Volunteers + Helpful Information */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="rounded-xs overflow-hidden shadow-xs border border-gray-200 bg-gray-100">
              <img
                src={volunteerCampImg}
                alt="Community volunteers and medical team helping donors at camp"
                className="w-full h-48 sm:h-56 lg:h-60 object-cover"
                loading="lazy"
              />
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Good To Know
                </span>
                <h3 className="font-heading font-bold text-lg sm:text-2xl text-gray-900 tracking-tight inline-block relative pb-1 uppercase">
                  Helpful Information
                  <span className="absolute bottom-0 left-0 w-10 h-0.5 bg-[#ea3a3c]"></span>
                </h3>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-gray-700 font-medium-500">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border-2 border-[#ea3a3c] mt-1.5 shrink-0 bg-red-50"></span>
                  <span>Maintain a healthy iron level by eating iron rich foods prior to camp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border-2 border-[#ea3a3c] mt-1.5 shrink-0 bg-red-50"></span>
                  <span>Drink an extra 16 oz. of water or fresh juice prior to your blood donation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border-2 border-[#ea3a3c] mt-1.5 shrink-0 bg-red-50"></span>
                  <span>Eat a light, energizing meal 1-2 hours before; do not come on empty stomach.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border-2 border-[#ea3a3c] mt-1.5 shrink-0 bg-red-50"></span>
                  <span>Remember to bring your original Pakistani CNIC (13 digits) for official records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border-2 border-[#ea3a3c] mt-1.5 shrink-0 bg-red-50"></span>
                  <span>Finally, try to get a good night's sound sleep before Sunday, Oct 4.</span>
                </li>
              </ul>

              {/* Quick switch helper button on left side */}
              <div className="pt-2">
                <div className="bg-white border border-gray-200 rounded-xs p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <strong className="text-gray-900 block font-bold">Already registered for camp?</strong>
                    <span className="text-gray-500 text-[11px]">Track your entry token or re-download your slip.</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab(activeTab === 'register' ? 'track' : 'register');
                    }}
                    className="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3 py-1.5 rounded-xs transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5 text-[#ea3a3c]" />
                    <span>{activeTab === 'register' ? 'Track Token' : 'New Form'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Switchable Form / Tracking Box */}
          <div className="lg:col-span-6 space-y-3">
            {/* Top Toggle Switch: [ 📝 Register as Donor ] [ 🔍 Track Token Number ] */}
            <div className="grid grid-cols-2 bg-gray-200 p-1 rounded-xs gap-1 text-xs font-bold font-heading">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setTrackingError(null);
                }}
                className={`py-2 px-3 rounded-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-[#ea3a3c] fill-[#ea3a3c]" />
                <span>Register as Donor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('track');
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 rounded-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'track'
                    ? 'bg-[#ea3a3c] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track Token #</span>
              </button>
            </div>

            {/* TAB 1: TRACK TOKEN NUMBER */}
            {activeTab === 'track' && (
              <div className="bg-[#3e454c] rounded-xs p-4 sm:p-6 text-white shadow-md animate-fade-in">
                <div className="text-center pb-3">
                  <h3 className="font-heading font-bold text-base sm:text-xl uppercase tracking-wider text-white flex items-center justify-center gap-2">
                    <Search className="w-4 h-4 text-[#ea3a3c]" />
                    <span>Track Your Token</span>
                  </h3>
                  <p className="text-[11px] text-gray-300 mt-1">
                    Enter your complete Token Number (e.g. BDC-1234), Phone, or CNIC
                  </p>
                  <div className="w-10 h-0.5 bg-[#ea3a3c] mx-auto mt-2"></div>
                </div>

                {/* Search Form - Fully Responsive */}
                <form onSubmit={handleTrackSearch} className="space-y-3 mb-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Enter Full Token (e.g. BDC-1234) or Phone / CNIC"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="flex-1 min-h-[44px] px-3.5 py-2.5 bg-white text-gray-900 text-sm font-medium-500 rounded-xs focus:outline-none focus:ring-2 focus:ring-[#ea3a3c]"
                    />
                    <button
                      type="submit"
                      disabled={isTracking}
                      className="min-h-[44px] px-5 py-2.5 bg-[#ea3a3c] hover:bg-[#d0282a] text-white font-heading font-bold text-xs uppercase rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 active:scale-98"
                    >
                      {isTracking ? (
                        <span>Searching...</span>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Track Token</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {trackingError && (
                  <div className="mb-4 p-3 bg-red-900/90 border border-red-700 text-rose-100 text-xs rounded-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {/* Result Card When Tracked */}
                {trackedDonor && (
                  <div className="space-y-3 pt-1 animate-fade-in text-gray-900">
                    <div 
                      ref={trackedSlipRef}
                      className="bg-white rounded-xs border-2 border-[#ea3a3c] p-4 sm:p-5 shadow-xs space-y-3"
                    >
                      {/* Live Status Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                            Registration Token
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xl font-black text-red-800">
                              {trackedDonor.tokenNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyToken(trackedDonor.tokenNumber || '')}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
                              title="Copy Token"
                            >
                              {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Status Pill */}
                        {(() => {
                          const badge = getStatusBadge(trackedDonor.status);
                          return (
                            <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${badge.bg}`}>
                              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`}></span>
                              <span>{badge.title}</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Visual Steps Progress */}
                      <div className="bg-gray-50 p-2.5 rounded-xs border border-gray-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1">
                          <span className="text-[#ea3a3c] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Token Issued
                          </span>
                          <span className={trackedDonor.status === 'Confirmed' || trackedDonor.status === 'Donated' ? 'text-[#ea3a3c] flex items-center gap-1' : 'text-gray-400'}>
                            • Vitals Check
                          </span>
                          <span className={trackedDonor.status === 'Donated' ? 'text-emerald-700 font-black flex items-center gap-1' : 'text-gray-400'}>
                            • Donated
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#ea3a3c] h-full transition-all duration-500"
                            style={{
                              width: trackedDonor.status === 'Donated' ? '100%' : trackedDonor.status === 'Confirmed' ? '66%' : '33%'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Donor Details Table */}
                      <div className="bg-gray-50 rounded-xs p-3 text-xs space-y-1.5 border border-gray-200 font-medium-500">
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">Donor Name:</span>
                          <strong className="text-gray-900 font-bold">{trackedDonor.name}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">Blood Group:</span>
                          <span className="font-bold text-[#ea3a3c]">{trackedDonor.bloodGroup}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">Contact Phone:</span>
                          <span className="font-bold text-gray-900">{trackedDonor.phone}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">CNIC Number:</span>
                          <span className="font-mono font-bold text-gray-900">{trackedDonor.cnic}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">Residential Address:</span>
                          <span className="text-gray-900 text-right max-w-[200px] sm:max-w-xs break-words">{trackedDonor.address}</span>
                        </div>

                        {/* Any Custom Fields */}
                        {trackedDonor.customFields && Object.entries(trackedDonor.customFields).map(([k, v]) => (
                          v ? (
                            <div key={k} className="flex justify-between py-1 border-b border-gray-200">
                              <span className="text-gray-500">{k}:</span>
                              <span className="text-gray-900 font-semibold">{String(v)}</span>
                            </div>
                          ) : null
                        ))}
                      </div>

                      {/* Camp Timing Reminder */}
                      <div className="bg-red-50 rounded-xs p-2.5 text-xs text-red-900 space-y-1 font-medium-500 border border-red-200">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <Calendar className="w-3.5 h-3.5 text-[#ea3a3c]" />
                          <span>Sunday, October 4, 2026 (10:00 AM – 6:00 PM)</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0 mt-0.5" />
                          <span>Madina Colony, Scheme 33 Cantonment, Karachi</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Tracked Token */}
                    <div className="space-y-2 pt-1 text-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportPdf(trackedSlipRef, trackedDonor)}
                          disabled={isGeneratingPdf}
                          className="min-h-[44px] py-2.5 px-3 bg-red-700 hover:bg-red-800 text-white font-heading font-bold text-xs uppercase rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isGeneratingPdf ? 'Creating PDF...' : 'Download PDF Slip'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintSlip(trackedDonor)}
                          className="min-h-[44px] py-2.5 px-3 bg-gray-800 hover:bg-gray-900 text-white font-heading font-bold text-xs uppercase rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>
                      </div>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `🩸 Blood Donation Camp Token: ${trackedDonor.tokenNumber} | Name: ${trackedDonor.name} (${trackedDonor.bloodGroup}) | Venue: Madina Colony Scheme 33 Cantonment, Karachi (Sunday, Oct 4, 2026). Status: ${trackedDonor.status || 'Registered'}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[44px] w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase rounded-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DYNAMIC REGISTRATION FORM (CONFIGURABLE BY ADMIN) */}
            {activeTab === 'register' && (
              <>
                {registeredDonor ? (
                  /* Printable & Exportable Token Slip After New Registration */
                  <div className="space-y-3.5 animate-fade-in">
                    <div 
                      ref={slipRef}
                      id="printable-slip"
                      className="bg-white rounded-xs border-2 border-[#ea3a3c] p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4 text-gray-900"
                    >
                      <div className="text-center pb-2 border-b border-gray-200">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-1">
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h4 className="font-heading font-bold text-base sm:text-lg text-gray-900 uppercase">
                          Registration Confirmed!
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium-500">
                          Your token is saved in our camp database.
                        </p>
                      </div>

                      {/* Token Box */}
                      <div className="bg-red-50 border border-red-200 rounded-xs p-2.5 sm:p-3 text-center">
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#ea3a3c] uppercase tracking-wider block">
                          Official Donor Entry Token
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-2xl sm:text-3xl font-black text-red-800">
                            {registeredDonor.tokenNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyToken(registeredDonor.tokenNumber || '')}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
                            title="Copy Token Number"
                          >
                            {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Donor Details Table */}
                      <div className="bg-gray-50 rounded-xs p-2.5 sm:p-3 text-xs space-y-1.5 border border-gray-200 font-medium-500">
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">Name:</span>
                          <strong className="text-gray-900 font-bold break-words text-right">{registeredDonor.name}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">Blood Group:</span>
                          <span className="font-bold text-[#ea3a3c]">{registeredDonor.bloodGroup}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">Phone:</span>
                          <span className="font-bold text-gray-900">{registeredDonor.phone}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-gray-500">CNIC:</span>
                          <span className="font-mono font-bold text-gray-900">{registeredDonor.cnic}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-gray-500">Address:</span>
                          <span className="text-gray-900 text-right max-w-[200px] sm:max-w-xs break-words">{registeredDonor.address}</span>
                        </div>
                      </div>

                      {/* Camp Details */}
                      <div className="bg-gray-100 rounded-xs p-2 sm:p-2.5 text-xs text-gray-700 space-y-1 font-medium-500">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <Calendar className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0" />
                          <span>Sunday, October 4, 2026 (10:00 AM – 6:00 PM)</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0 mt-0.5" />
                          <span>Madina Colony, Scheme 33 Cantonment, Karachi</span>
                        </div>
                      </div>
                    </div>

                    {/* Reliable Action Buttons */}
                    <div className="no-print space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportPdf(slipRef, registeredDonor)}
                          disabled={isGeneratingPdf}
                          className="min-h-[44px] py-2.5 px-3 bg-red-700 hover:bg-red-800 text-white font-heading font-bold text-xs uppercase rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isGeneratingPdf ? 'Creating PDF...' : 'Download PDF Slip'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintSlip(registeredDonor)}
                          className="min-h-[44px] py-2.5 px-3 bg-gray-800 hover:bg-gray-900 text-white font-heading font-bold text-xs uppercase rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>
                      </div>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `🩸 I registered for Blood Donation Camp Scheme 33 Cantonment (Sunday, Oct 4, 2026)! My Token: ${registeredDonor.tokenNumber}. "Whoever saves one life - it is as if he saved mankind entirely."`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[44px] w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase rounded-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setTrackingInput(registeredDonor.tokenNumber || '');
                            setTrackedDonor(registeredDonor);
                            setActiveTab('track');
                          }}
                          className="text-[#ea3a3c] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Track Live Status</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetRegistration}
                          className="text-gray-500 hover:text-[#ea3a3c] font-medium-500 underline cursor-pointer"
                        >
                          Register Another Person
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* DYNAMIC REQUEST APPOINTMENT Form Card */
                  <div className="bg-[#3e454c] rounded-xs p-4 sm:p-6 text-white shadow-md animate-fade-in">
                    <div className="text-center pb-3 sm:pb-4">
                      <h3 className="font-heading font-bold text-base sm:text-xl uppercase tracking-wider text-white">
                        GET REGISTRATION
                      </h3>
                      <div className="w-60 h-0.5 bg-[#ea3a3c] mx-auto mt-1"></div>
                    </div>

                    {errorMessage && (
                      <div className="mb-3 p-3 bg-red-900/90 border border-red-700 text-rose-100 text-xs rounded-xs flex items-center gap-2 animate-shake">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
                        <span className="font-semibold">{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
                      {/* Dynamically Render All Form Fields According to Admin Configuration */}
                      {formFields.map((field) => {
                        const val = formValues[field.id] !== undefined
                          ? formValues[field.id]
                          : (field.type === 'select' && field.options ? field.options[0] : '');

                        if (field.type === 'select') {
                          return (
                            <div key={field.id}>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                                {field.label} {field.required && <span className="text-[#ea3a3c]">*</span>}
                              </label>
                              <select
                                value={val}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className="w-full min-h-[44px] px-3 py-2.5 bg-white text-gray-800 text-base sm:text-sm rounded-xs focus:outline-none focus:ring-2 focus:ring-[#ea3a3c] font-bold cursor-pointer"
                              >
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {field.id === 'bloodGroup' ? `Blood Group: ${opt}` : opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        if (field.type === 'textarea') {
                          return (
                            <div key={field.id}>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                                {field.label} {field.required && <span className="text-[#ea3a3c]">*</span>}
                              </label>
                              <textarea
                                rows={2}
                                required={field.required}
                                placeholder={field.placeholder}
                                value={val}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 bg-white text-gray-900 text-base sm:text-sm font-medium-500 rounded-xs focus:outline-none focus:ring-2 focus:ring-[#ea3a3c]"
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={field.id}>
                            <label className="block text-[11px] font-bold text-gray-300 mb-1">
                              {field.label} {field.required && <span className="text-[#ea3a3c]">*</span>}
                            </label>
                            <input
                              type={field.type}
                              required={field.required}
                              maxLength={field.id === 'cnic' ? 15 : undefined}
                              placeholder={field.placeholder}
                              value={val}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              className={`w-full min-h-[44px] px-3 py-2.5 bg-white text-gray-900 text-base sm:text-sm font-medium-500 rounded-xs focus:outline-none focus:ring-2 focus:ring-[#ea3a3c] ${
                                field.id === 'cnic' ? 'font-mono' : ''
                              }`}
                            />
                          </div>
                        );
                      })}

                      {/* Submit Button */}
                      <div className="pt-1.5">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full min-h-[46px] py-3 bg-[#ea3a3c] hover:bg-[#d0282a] text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75"
                        >
                          {isSubmitting ? (
                            <span>GENERATING TOKEN & SAVING...</span>
                          ) : (
                            <span>GET REGISTRATION</span>
                          )}
                        </button>
                      </div>

                      {/* Link to tracking */}
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('track')}
                          className="text-xs text-gray-300 hover:text-white underline cursor-pointer"
                        >
                          Already registered? Track your token number
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};