// import React from 'react';
// import heroCampImg from '../assets/images/hero_camp_real.jpg';
// import donorGivingBloodImg from '../assets/images/donor_giving_blood_real.jpg';
// import bloodDrawImg from '../assets/images/blood_draw_real.jpg';
// import volunteerCampImg from '../assets/images/volunteer_camp_real.jpg';
// import bloodBagsImg from '../assets/images/blood_bags_real.jpg';
// import communityCampImg from '../assets/images/community_camp_real.jpg';

// export const CampaignGallery: React.FC = () => {
//   const photos = [
//     heroCampImg,
//     donorGivingBloodImg,
//     bloodDrawImg,
//     volunteerCampImg,
//     bloodBagsImg,
//     communityCampImg
//   ];

//   return (
//     <section id="gallery" className="py-8 sm:py-12 lg:py-14 bg-white border-b border-gray-100">
//       <div className="max-w-5xl mx-auto px-4 sm:px-6">
//         {/* Gallery Header */}
//         <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
//           <h2 className="font-heading font-bold text-lg sm:text-2xl text-gray-900 uppercase tracking-tight">
//             CAMPAIGN GALLERY
//           </h2>
//           <div className="w-10 h-0.5 bg-[#ea3a3c] mx-auto my-1.5"></div>
//           <p className="text-[11px] sm:text-xs text-gray-500 font-medium-500">
//             Real moments from voluntary blood donation drives in Scheme 33 Cantonment
//           </p>
//         </div>

//         {/* 6-Photo Clean & Simple Grid (No text, labels or names on photos) */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
//           {photos.map((imgUrl, idx) => (
//             <div 
//               key={idx}
//               className="relative rounded-xs overflow-hidden border border-gray-200 shadow-2xs h-48 xs:h-52 sm:h-48 md:h-52 lg:h-56 bg-gray-100"
//             >
//               <img
//                 src={imgUrl}
//                 alt="Blood donation camp"
//                 className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
//                 loading="lazy"
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };
