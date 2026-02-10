import { LicenseConfig, LicenseState, ILicenseManager } from './types';

const STORAGE_KEY_PREMIUM = 'trust_license_premium';
const STORAGE_KEY_FEATURES = 'trust_license_features';
const STORAGE_KEY_ID = 'trust_license_key';

export class TrustLicenseManager implements ILicenseManager {
  private config: LicenseConfig;
  private state: LicenseState;
  private listeners: ((state: LicenseState) => void)[] = [];

  constructor(config: LicenseConfig) {
    this.config = config;
    this.state = this.loadState();
  }

  private loadState(): LicenseState {
    // Generate a persistent ID if not exists
    let licenseKey = localStorage.getItem(STORAGE_KEY_ID);
    if (!licenseKey) {
      licenseKey = this.generateLicenseKey();
      localStorage.setItem(STORAGE_KEY_ID, licenseKey);
    }

    return {
      isPremium: localStorage.getItem(STORAGE_KEY_PREMIUM) === 'true',
      unlockedFeatures: JSON.parse(localStorage.getItem(STORAGE_KEY_FEATURES) || '[]'),
      licenseKey,
    };
  }

  private generateLicenseKey(): string {
    // Simple random key generation: XXXX-XXXX-XXXX-XXXX
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${segment()}-${segment()}-${segment()}-${segment()}`;
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: LicenseState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public isFeatureUnlocked(featureId?: string): boolean {
    if (this.state.isPremium) return true;
    if (!featureId) return this.state.isPremium;
    return this.state.unlockedFeatures.includes(featureId);
  }

  public getLicenseState(): LicenseState {
    return this.state;
  }

  public unlockFeature(featureId: string): void {
    if (this.state.unlockedFeatures.includes(featureId)) return;
    
    const newFeatures = [...this.state.unlockedFeatures, featureId];
    this.state = { ...this.state, unlockedFeatures: newFeatures };
    
    localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(newFeatures));
    this.notify();
  }

  public unlockAll(): void {
    this.state = { ...this.state, isPremium: true, unlockedFeatures: [] };
    localStorage.setItem(STORAGE_KEY_PREMIUM, 'true');
    localStorage.removeItem(STORAGE_KEY_FEATURES); // Clear individual features as global is active
    this.notify();
  }

  public resetLicense(): void {
    localStorage.removeItem(STORAGE_KEY_PREMIUM);
    localStorage.removeItem(STORAGE_KEY_FEATURES);
    // Note: We don't remove licenseKey (STORAGE_KEY_ID) as it identifies the user/device
    
    this.state = {
      isPremium: false,
      unlockedFeatures: [],
      licenseKey: this.state.licenseKey
    };
    this.notify();
  }

  public generatePaymentQrUrl(amount: number, content: string): string {
    const { bankId, accountNo, template } = this.config.bankInfo;
    const cleanContent = content.replace(/[^a-zA-Z0-9 ]/g, ''); // Basic sanitation
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template || 'compact'}.png?amount=${amount}&addInfo=${encodeURIComponent(cleanContent)}`;
  }
}
