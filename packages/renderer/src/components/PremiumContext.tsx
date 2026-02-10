import React, {createContext, useContext, useEffect, useState} from 'react';

interface PremiumContextType {
  isPremium: boolean;
  unlockedFeatures: string[];
  unlockFeature: (featureId: string) => void;
  unlockAll: () => void;
  isFeatureUnlocked: (featureId?: string) => boolean;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  unlockedFeatures: [],
  unlockFeature: () => {},
  unlockAll: () => {},
  isFeatureUnlocked: () => false,
});

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);

  useEffect(() => {
    // Load state from localStorage on mount
    const savedPremium = localStorage.getItem('isPremium') === 'true';
    const savedFeatures = JSON.parse(localStorage.getItem('unlockedFeatures') || '[]');
    
    setIsPremium(savedPremium);
    setUnlockedFeatures(savedFeatures);
  }, []);

  const unlockAll = () => {
    setIsPremium(true);
    localStorage.setItem('isPremium', 'true');
    // Clear individual features as they are redundant now
    setUnlockedFeatures([]); 
    localStorage.removeItem('unlockedFeatures');
  };

  const unlockFeature = (featureId: string) => {
    if (unlockedFeatures.includes(featureId)) return;
    
    const newFeatures = [...unlockedFeatures, featureId];
    setUnlockedFeatures(newFeatures);
    localStorage.setItem('unlockedFeatures', JSON.stringify(newFeatures));
  };

  const isFeatureUnlocked = (featureId?: string) => {
    if (isPremium) return true;
    if (!featureId) return isPremium;
    return unlockedFeatures.includes(featureId);
  };

  return (
    <PremiumContext.Provider value={{
      isPremium, 
      unlockedFeatures, 
      unlockFeature, 
      unlockAll,
      isFeatureUnlocked
    }}>
      {children}
    </PremiumContext.Provider>
  );
};
