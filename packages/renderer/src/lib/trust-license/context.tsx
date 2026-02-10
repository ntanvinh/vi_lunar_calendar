import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { LicenseConfig, LicenseState, ILicenseManager } from './types';
import { TrustLicenseManager } from './core';

interface LicenseContextValue {
  manager: ILicenseManager;
  state: LicenseState;
  config: LicenseConfig;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

interface LicenseProviderProps {
  config: LicenseConfig;
  children: React.ReactNode;
}

export const LicenseProvider: React.FC<LicenseProviderProps> = ({ config, children }) => {
  // Memoize manager to avoid recreation on re-renders unless config changes deeply
  // (In practice, config should be static constant)
  const manager = useMemo(() => new TrustLicenseManager(config), []);
  const [state, setState] = useState<LicenseState>(manager.getLicenseState());

  useEffect(() => {
    // Subscribe to state changes from the manager
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  return (
    <LicenseContext.Provider value={{ manager, state, config }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
