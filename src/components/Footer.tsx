import React from 'react';
import { Heart, MapPin, Phone, Mail, ArrowUp } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1a1c1e] text-gray-400 text-xs pt-8 sm:pt-10 pb-6 relative font-medium-500">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top Header Row with Logo & Description */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#ea3a3c] flex items-center justify-center text-white shrink-0">
              <Heart className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="font-heading font-bold text-base sm:text-lg tracking-tight text-white">
              <span className="text-[#ea3a3c]">BLOOD</span> CAMP
            </div>
          </div>

          <p className="text-gray-400 text-xs max-w-xl leading-relaxed">
            Organized by <strong>Jamaat-e-Islami, Madina Colony Ward 10</strong> in collaboration with <strong>Blood Donors Group Societies</strong> and <strong>Jamaat-e-Islami Scheme 33 Cantonment</strong> to raise awareness and provide lifeline support for patients across Karachi.
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-6 border-b border-gray-800">
          {/* Col 1: CONTACT US */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider">
              CONTACT US
            </h4>
            <div className="w-6 h-0.5 bg-[#ea3a3c] mb-2"></div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0 mt-0.5" />
                <span>Madina Colony, Scheme 33 Cantonment, Karachi</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0" />
                <a href="mailto:info@scheme33blood.org" className="hover:text-white transition-colors">info@scheme33blood.org</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0" />
                <a href="tel:03001234567" className="hover:text-white transition-colors">0300-1234567</a>
              </div>
            </div>
          </div>

          {/* Col 2: CAMP SCHEDULE */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider">
              CAMP SCHEDULE
            </h4>
            <div className="w-6 h-0.5 bg-[#ea3a3c] mb-2"></div>

            <ul className="space-y-1.5 text-xs">
              <li><strong className="text-gray-200">Date:</strong> Sunday, October 4, 2026</li>
              <li><strong className="text-gray-200">Time:</strong> 10:00 AM to 6:00 PM</li>
              <li><strong className="text-gray-200">Venue:</strong> Madina Colony, Scheme 33</li>
              <li><strong className="text-gray-200">Screening:</strong> Free Hb & Vitals Test</li>
            </ul>
          </div>

          {/* Col 3: HUMANITARIAN MISSION */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider">
              HUMANITARIAN MISSION
            </h4>
            <div className="w-6 h-0.5 bg-[#ea3a3c] mb-2"></div>

            <p className="text-gray-400 text-xs leading-relaxed">
              "And whoever saves one [life] - it is as if he had saved mankind entirely." (Surah Al-Ma'idah - 5:32)
            </p>
            <p className="text-xs text-gray-500">
              100% voluntary, safe, and transparent.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-[11px] text-center sm:text-left">
          <span>
            © 2026 Jamaat-e-Islami Scheme 33 Cantonment. All Rights Reserved.
          </span>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer py-1"
              title="Coordinator Login"
            >
              Coordinator Portal
            </button>
            <button
              onClick={scrollToTop}
              className="w-7 h-7 rounded-xs bg-[#ea3a3c] hover:bg-[#d0282a] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
              title="Back to Top"
              aria-label="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
