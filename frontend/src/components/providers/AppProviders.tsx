'use client';

import React from 'react';
import AuthProvider from './AuthProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * AppProviders component that wraps all application-level providers
 * This component centralizes all context providers for the application
 */
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default AppProviders;
