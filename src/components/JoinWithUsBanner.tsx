import React from 'react';
import communityCampImg from '../assets/images/community_camp_real.jpg';

export const JoinWithUsBanner: React.FC = () => {
  return (
    <section className="relative py-10 sm:py-14 bg-red-950 overflow-hidden text-center text-white">
      {/* Background Image with Dark Red Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity"
        style={{
          backgroundImage: `url(${communityCampImg})`
        }}
      ></div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#931719]/95 via-[#b91c1e]/90 to-[#931719]/95"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-2.5 sm:space-y-3">
        {/* Top Tagline */}
        {/* <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-red-200 block">
          Inspirational Quranic Reminder
        </span> */}

        {/* Big White Headline */}
        <h2 className="font-heading font-bold text-xl sm:text-3xl lg:text-4xl tracking-tight uppercase px-2">
          JOIN WITH US AND SAVE LIFE
        </h2>

        {/* White Underline Accent */}
        <div className="w-10 sm:w-12 h-0.5 bg-white mx-auto my-1.5 sm:my-2"></div>

        {/* Arabic Calligraphy Ayat */}
        {/* <p className="font-arabic-ayat text-xl sm:text-3xl text-amber-300 font-bold pt-1 leading-loose break-words" dir="rtl">
          « وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا »
        </p> */}

        {/* Urdu Translation */}

        {/* Translation */}
        {/* <blockquote className="text-xs sm:text-sm text-white font-medium  max-w-xl mx-auto leading-relaxed px-2">
          "And whoever saves a life - it is as if he had saved the whole mankind."
          <span className="block text-[10px] sm:text-xs font-bold text-amber-300 not-italic uppercase tracking-widest mt-1 font-sans">
            Surah Al-Ma'idah — 5:32
          </span>
        
        
        <p className="font-urdu text-sm sm:text-lg text-amber-200 font-semibold leading-relaxed max-w-xl mx-auto px-2" dir="rtl">
          "اور جس نے کسی ایک (انسان) کی جان بچائی، گویا اس نے تمام انسانوں کی جان بچائی۔"
        </p>
        </blockquote> */}

        <p className="text-xs sm:text-sm font-bold text-red-100 max-w-lg mx-auto pt-0.5 px-2">
          Your single drop of blood can become someone's life.
        </p>
      </div>
    </section>
  );
};
