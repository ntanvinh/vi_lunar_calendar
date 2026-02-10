export interface BankInfo {
  bankId: string;
  accountNo: string;
  accountName: string;
  template?: 'compact' | 'qr_only' | 'print';
}

export interface LicenseFeature {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface LicenseConfig {
  appName: string;
  bankInfo: BankInfo;
  features: LicenseFeature[];
  comboPrice?: number;
  comboName?: string;
  comboDescription?: string;
  /**
   * Custom message to show when asking for payment
   * @default "Cảm ơn bạn đã sử dụng. Nếu thấy hữu ích hãy ủng hộ tác giả."
   */
  paymentMessage?: string;
}

export interface LicenseState {
  isPremium: boolean;
  unlockedFeatures: string[];
  licenseKey?: string;
}

export interface ILicenseManager {
  // Check functionality
  isFeatureUnlocked(featureId?: string): boolean;
  getLicenseState(): LicenseState;
  
  // Actions
  unlockFeature(featureId: string): void;
  unlockAll(): void;
  resetLicense(): void;
  verifyKey(key: string): { valid: boolean; featureId?: string; isCombo?: boolean };
  
  // Helpers
  generatePaymentQrUrl(amount: number, content: string): string;
}
