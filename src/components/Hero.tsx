import React from 'react';
import { Phone, Calendar, Clock, MapPin, Heart, ArrowRight } from 'lucide-react';
import heroCampImg from '../assets/images/hero_camp_real.jpg';

interface HeroProps {
  onScrollToForm: () => void;
  onScrollToTrack?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToForm, onScrollToTrack }) => {
  return (
    <section id="home" className="relative min-h-[480px] sm:min-h-[540px] lg:min-h-[580px] flex items-center bg-gray-950 overflow-hidden">
      {/* Background Image: Authentic Real Community Blood Donation Camp */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-100 sm:scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url(${heroCampImg})`
        }}
      ></div>

      {/* Dark Vignette Overlay for High Readability on Any Device Screen */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/98 via-gray-950/90 to-gray-950/65 z-10"></div>

      {/* Content Container - Fully Responsive & Fluid */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 w-full animate-fade-in">
        <div className="max-w-2xl space-y-4 sm:space-y-5">
          {/* Subtitle Badge with Animated Live Red Dot */}
          {/* Subtitle Badge with Animated Live Red Dot */}
          <div className="inline-flex items-center gap-2 bg-white border border-red-500 px-3.5 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wide w-fit shadow-xs">
            {/* Animated dot inside */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff0004]"></span>
            </span>

            {/* Animated text */}
            <span className="text-black font-medium tracking-wider uppercase">
              Donate <span className="text-[#ff0004] font-bold">blood</span>, save life.
            </span>
          </div>
          <div className="border-l-4 border-[#ea3a3c] pl-3 sm:pl-4 py-2 text-white/95 space-y-2 bg-black/40 backdrop-blur-xs rounded-r-xs pr-3">
            {/* Arabic Quranic Text */}
            <p className="font-arabic-ayat text-xl sm:text-2xl lg:text-3xl text-amber-300 font-bold leading-relaxed tracking-wide" dir="rtl">
             وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا 
            </p>
            {/* Urdu Translation */}
            {/* English Meaning */}
            <p className="text-xs sm:text-sm italic text-gray-200 font-medium">
              "And whoever saves a life 
              <span className="text-[#ffffff] "> - it is as if he had saved mankind entirely." (Surah Al-Ma'idah 5:32)</span>"
            </p>


            <p className="font-urdu text-sm sm:text-base text-amber-100 font-semibold leading-relaxed" dir="rtl">
              "اور جس نے کسی ایک (انسان) کی جان بچائی، گویا اس نے تمام انسا نیت کی جان بچائی۔" <span className="text-xs text-amber-200/80 font-sans">(سورۃ المائدہ: 32)</span>
            </p>
          </div>
          {/* Main Headline */}
          <h1 className="font-heading font-bold text-2xl xs:text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.2] uppercase break-words">
            Your Blood <br />
            Can Bring Smile <br />
            <span className="text-[#ff0004]">to Someone’s Face.</span>
          </h1>

          {/* Inspirational Quranic Verse with Arabic, Urdu Translation, and English */}

          {/* Event Schedule Box - Responsive Layout */}
          <div className="bg-black/60 backdrop-blur-xs border border-white/10 rounded-xs p-3 sm:p-3.5 text-xs text-gray-200 space-y-2 font-medium-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Calendar className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0" />
                <span>Sunday, October 4, 2026</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Clock className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0" />
                <span>10:00 AM to 6:00 PM</span>
              </div>
            </div>
            <div className="flex items-start gap-1.5 text-gray-300 pt-1.5 border-t border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#ea3a3c] shrink-0 mt-0.5" />
              <span>Madina Colony, Scheme 33 Cantonment, Karachi</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
            <button
              onClick={onScrollToForm}
              className="w-full sm:w-auto min-h-[44px] bg-[#ea3a3c] hover:bg-[#d0282a] text-white font-heading font-bold text-xs uppercase px-6 py-3 rounded-xs tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>REGISTER</span>
            </button>

            <a
              href="tel:03001234567"
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-gray-800/90 hover:bg-gray-700 text-white font-heading font-bold text-xs uppercase px-5 py-3 rounded-xs tracking-wider transition-all border border-white/10 active:scale-98"
            >
              <Phone className="w-3.5 h-3.5 text-[#ea3a3c]" />
              <span>CALL : 0300-123456798</span>
            </a>
          </div>

          {/* Quick Track Token Link */}
          <div className="pt-0.5">
            <button
              onClick={onScrollToTrack || onScrollToForm}
              className="text-xs text-gray-300 hover:text-white underline cursor-pointer flex items-center gap-1.5 font-medium transition-colors text-left"
            >
              <span>Already registered? Click here to track your token number & status</span>
              <ArrowRight className="w-3 h-3 text-[#ea3a3c] shrink-0" />
            </button>
          </div>

          {/* Organized By */}
          <p className="text-[11px] text-gray-400 font-medium-500 pt-1 leading-normal">
            <strong>Organized By:</strong> Jamaat-e-Islami, Madina Colony Ward 10 in collaboration with Blood Donors Group Societies and Jamaat-e-Islami Scheme 33 Cantonment.
          </p>
        </div>
      </div>
    </section>
  );
};