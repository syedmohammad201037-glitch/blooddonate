import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Calendar, Menu, X, Search } from 'lucide-react';
import jamaatLogo from '../assets/images/jamaat_scheme33_logo.png';

interface HeaderProps {
  onScrollToForm: () => void;
  onScrollToTrack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToForm, onScrollToTrack }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (id: string, isTrack = false) => {
    setMobileMenuOpen(false);
    if (isTrack && onScrollToTrack) {
      onScrollToTrack();
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs">
      {/* Top Red Bar - Fully Responsive */}
      <div className="bg-[#ea3a3c] text-white text-[10px] sm:text-xs py-1.5 px-3 sm:px-4 font-medium-500">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <span className="flex items-center gap-1 sm:gap-1.5 truncate">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate font-bold">Madina Colony, Scheme 33 Cantonment</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 shrink-0 text-white/90">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Sun, Oct 4, 2026 (10 AM - 6 PM)</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-[10px] sm:text-xs">
            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <a href="tel:03001234567" className="hover:underline font-bold">0300-1234567</a>
            <span className="hidden sm:inline text-white/70">/</span>
            <a href="tel:03337654321" className="hidden sm:inline hover:underline font-bold">0333-7654321</a>
          </div>
        </div>
      </div>

      {/* Main Navbar - Fully Responsive with lg:flex breakpoint to prevent overlap */}
      <nav className="max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-1 flex items-center justify-between gap-2">
        {/* Brand */}
        <a href="#home" className="flex items-center gap-2 min-w-0 flex-1 lg:flex-none">
          <img
            src={jamaatLogo}
            alt="Jamaat-e-Islami Scheme 33 Cantonment"
            className="h-11 min-[400px]:h-14 sm:h-[4.5rem] w-auto object-contain shrink-0"
          />
          <div className="min-w-0 truncate">
            <div className="font-heading font-bold text-sm sm:text-lg tracking-tight text-gray-900 leading-tight truncate">
              <span className="text-[#ea3a3c]">BLOOD</span> CAMP
            </div>
            <p className="text-[9px] sm:text-[10px] text-gray-900  uppercase tracking-wider truncate font-bold">
              Scheme 33 Cantonment
            </p>
          </div>
        </a>

        {/* Desktop Navigation Links (>= 1024px to prevent collision on tablets) */}
        <div className="hidden lg:flex items-center gap-5 text-xs font-bold text-gray-700 tracking-wide uppercase">
          <a href="#home" className="hover:text-[#ea3a3c] transition-colors py-1">Home</a>
          <a href="#about-us" className="hover:text-[#ea3a3c] transition-colors py-1">About Camp</a>
          <a href="#campaign" className="hover:text-[#ea3a3c] transition-colors py-1">Schedule</a>
          <a href="#register-section" className="hover:text-[#ea3a3c] transition-colors py-1">Register</a>
          <button
            onClick={() => handleNavClick('register-section', true)}
            className="hover:text-[#ea3a3c] transition-colors py-1 flex items-center gap-1 cursor-pointer font-bold uppercase"
          >
            <Search className="w-3 h-3 text-[#ea3a3c]" />
            <span>Track Token</span>
          </button>
          <a href="#gallery" className="hover:text-[#ea3a3c] transition-colors py-1">Gallery</a>
        </div>

        {/* Actions (CTA + Mobile/Tablet Hamburger) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={onScrollToForm}
            className="bg-[#ea3a3c] hover:bg-[#d0282a] text-white font-heading font-bold text-[11px] sm:text-xs uppercase px-3 sm:px-4 py-2 sm:py-2.5 rounded-xs tracking-wider transition-colors cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            DONATE NOW
          </button>

          {/* Hamburger Toggle (Visible on mobile and tablet < 1024px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-[#ea3a3c] hover:bg-gray-100 rounded-xs transition-colors cursor-pointer focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile/Tablet Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 animate-fade-in shadow-lg">
          <button
            onClick={() => handleNavClick('home')}
            className="block w-full text-left py-2.5 px-3 hover:bg-red-50 hover:text-[#ea3a3c] rounded-xs transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('about-us')}
            className="block w-full text-left py-2.5 px-3 hover:bg-red-50 hover:text-[#ea3a3c] rounded-xs transition-colors"
          >
            About Camp
          </button>
          <button
            onClick={() => handleNavClick('campaign')}
            className="block w-full text-left py-2.5 px-3 hover:bg-red-50 hover:text-[#ea3a3c] rounded-xs transition-colors"
          >
            Schedule & Venue
          </button>
          <button
            onClick={() => handleNavClick('register-section')}
            className="block w-full text-left py-2.5 px-3 bg-red-50 text-[#ea3a3c] font-bold rounded-xs transition-colors"
          >
            Register as Donor
          </button>
          <button
            onClick={() => handleNavClick('register-section', true)}
            className="block w-full text-left py-2.5 px-3 hover:bg-red-50 text-gray-800 hover:text-[#ea3a3c] font-bold rounded-xs transition-colors flex items-center gap-2"
          >
            <Search className="w-3.5 h-3.5 text-[#ea3a3c]" />
            <span>Track Token Number</span>
          </button>
          <button
            onClick={() => handleNavClick('gallery')}
            className="block w-full text-left py-2.5 px-3 hover:bg-red-50 hover:text-[#ea3a3c] rounded-xs transition-colors"
          >
            Camp Gallery
          </button>
        </div>
      )}
    </header>
  );
};