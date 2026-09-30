import React from 'react';

interface OurCampaignsProps {
  onScrollToForm?: () => void;
}

export const OurCampaigns: React.FC<OurCampaignsProps> = () => {
  return (
    <section
      id="campaign"
      className="py-8 sm:py-12 lg:py-14 bg-white border-b border-gray-100"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight inline-block relative pb-2 uppercase">
            OUR CAMPAIGN
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-70 h-1 bg-[#ea3a3c]"></span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium-500 mt-4">
            All over Karachi we arrange regular voluntary blood donation camps
            and visit societies, universities, and commercial zones to raise
            awareness for critical emergency blood needs and thalassemia
            patients.
          </p>
        </div>
      </div>
    </section>
  );
};
