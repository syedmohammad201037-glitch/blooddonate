import React from 'react';
import doctorCheckupImg from '../assets/images/doctor_checkup_real.jpg';

export const WhoWeAre: React.FC = () => {
  return (
    <section id="about-us" className="py-8 sm:py-12 lg:py-14 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left Column: Text & Bullets */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
            <div>
              <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight inline-block relative pb-2 uppercase">
                Who We Are?
                <span className="absolute bottom-0 left-0 w-12 h-1 bg-[#ea3a3c]"></span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium-500">
              Blood Donation Camp is an initiative for the public community organized by <strong>Jamaat-e-Islami, Madina Colony Ward 10</strong> in collaboration with <strong>Blood Donors Group Societies</strong> and <strong>Jamaat-e-Islami Scheme 33 Cantonment</strong>. We connect voluntary donors with emergency hospital units and children suffering from Thalassemia Major across Karachi.
            </p>

            {/* List with red bullet rings */}
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-gray-700 font-medium-500">
              <li className="flex items-start gap-2 sm:gap-2.5">
                <span className="w-2 h-2 rounded-full border-2 border-[#ea3a3c] mt-1 shrink-0 bg-red-50"></span>
                <span>Specialist blood donors and clinical medical supervision by qualified Pakistani doctors.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-2.5">
                <span className="w-2 h-2 rounded-full border-2 border-[#ea3a3c] mt-1 shrink-0 bg-red-50"></span>
                <span>Direct community support for thalassemia centers and critical surgery requirements in Karachi.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-2.5">
                <span className="w-2 h-2 rounded-full border-2 border-[#ea3a3c] mt-1 shrink-0 bg-red-50"></span>
                <span>High quality assessment, free Hemoglobin (Hb) test, Blood Pressure and vitals on the spot.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-2.5">
                <span className="w-2 h-2 rounded-full border-2 border-[#ea3a3c] mt-1 shrink-0 bg-red-50"></span>
                <span>100% sterile, single-use disposable collection kits ensuring total donor safety.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-2.5">
                <span className="w-2 h-2 rounded-full border-2 border-[#ea3a3c] mt-1 shrink-0 bg-red-50"></span>
                <span>The extra care of our dedicated local youth volunteers and energetic post-donation refreshments.</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Doctor Examination & Medical Checkup Image */}
          <div className="lg:col-span-5">
            <div className="rounded-xs overflow-hidden shadow-xs border border-gray-200 bg-gray-100">
              <img
                src={doctorCheckupImg}
                alt="Medical doctor screening donor at camp"
                className="w-full h-56 sm:h-64 lg:h-80 object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
