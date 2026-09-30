import React from 'react';
import { Heart } from 'lucide-react';

interface BecomeAPartBannerProps {
  onScrollToForm: () => void;
}

export const BecomeAPartBanner: React.FC<BecomeAPartBannerProps> = ({ onScrollToForm }) => {
  return (
    <section className="py-8 sm:py-10 bg-gray-50 border-b border-gray-200 text-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-2.5 sm:space-y-3">
        <h2 className="font-heading font-bold text-lg sm:text-2xl text-gray-900 tracking-tight">
          Become A Part Of Great Work Today
        </h2>

        <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed font-medium-500">
          <strong className="text-[#ea3a3c]">Come forward! Save lives, donate blood.</strong> You can give blood at our camp in Scheme 33 Cantonment to help children with thalassemia and trauma surgery patients.
        </p>

        <p className="text-xs font-bold text-gray-700 italic">
          "Your single drop of blood can become someone's life."
        </p>

        <div className="pt-2">
          <button
            onClick={onScrollToForm}
            className="w-full sm:w-auto min-h-[44px] bg-[#ea3a3c] hover:bg-[#d0282a] text-white font-heading font-bold text-xs uppercase px-6 py-2.5 sm:py-3 rounded-xs tracking-wider transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>JOIN WITH US</span>
          </button>
        </div>
      </div>
    </section>
  );
};
