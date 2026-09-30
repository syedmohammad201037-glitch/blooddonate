/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WhoWeAre } from './components/WhoWeAre';
import { JoinWithUsBanner } from './components/JoinWithUsBanner';
import { OurCampaigns } from './components/OurCampaigns';
import { RegistrationAndHelpfulInfo } from './components/RegistrationAndHelpfulInfo';
import { CounterStats } from './components/CounterStats';
// import { CampaignGallery } from './components/CampaignGallery';
import { BecomeAPartBanner } from './components/BecomeAPartBanner';
import { Footer } from './components/Footer';
import { AdminPortal } from './components/AdminPortal';

export default function App() {
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    return (
      path.includes('/admin') ||
      path.includes('/admin-portal') ||
      search.includes('admin') ||
      hash.includes('admin')
    );
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(checkIsAdminRoute());

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(checkIsAdminRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const openAdmin = () => {
    setIsAdminView(true);
    try {
      window.history.pushState({}, '', '/admin');
    } catch {
      window.location.hash = 'admin';
    }
  };

  const closeAdmin = () => {
    setIsAdminView(false);
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
  };

  const scrollToForm = () => {
    const element = document.getElementById('register-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTrack = () => {
    try {
      window.location.hash = 'track';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch {}
    const element = document.getElementById('register-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isAdminView) {
    return <AdminPortal onBackToLanding={closeAdmin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800 antialiased font-sans selection:bg-[#ea3a3c] selection:text-white">
      {/* 1. Header (clean, no unwanted items, no admin button) */}
      <Header onScrollToForm={scrollToForm} onScrollToTrack={scrollToTrack} />

      <main className="flex-1">
        <Hero onScrollToForm={scrollToForm} onScrollToTrack={scrollToTrack} />

        <RegistrationAndHelpfulInfo />

        <WhoWeAre />

        <JoinWithUsBanner />


        <OurCampaigns onScrollToForm={scrollToForm} />

        <CounterStats />

        <BecomeAPartBanner onScrollToForm={scrollToForm} />
      </main>

      {/* 12. Footer */}
      <Footer onOpenAdmin={openAdmin} />
    </div>
  );
}
