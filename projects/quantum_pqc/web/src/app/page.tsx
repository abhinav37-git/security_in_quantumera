'use client';

import React, { useState, useEffect } from 'react';
import { LandingPage } from '../components/LandingPage';
import { ThemeMode } from '../types';

export default function PublicLanding() {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Sync html class for theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <LandingPage theme={theme} setTheme={setTheme} />;
}
