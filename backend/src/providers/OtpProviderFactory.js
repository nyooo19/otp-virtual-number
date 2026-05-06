import { FivesimProvider } from './FivesimProvider.js';
import { HeroSmsProvider } from './HeroSmsProvider.js';
import { NokosmurahProvider } from './NokosmurahProvider.js';
import dotenv from 'dotenv';

dotenv.config();

export class OtpProviderFactory {
  static getProvider(providerCode) {
    const apiKeys = {
      '5sim': process.env.FIVESIM_API_KEY,
      'hero_sms': process.env.HERO_SMS_API_KEY,
      'nokosmurah': process.env.NOKOSMURAH_API_KEY,
    };

    const apiKey = apiKeys[providerCode];
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${providerCode}`);
    }

    switch (providerCode) {
      case '5sim':
        return new FivesimProvider(apiKey);
      case 'hero_sms':
        return new HeroSmsProvider(apiKey);
      case 'nokosmurah':
        return new NokosmurahProvider(apiKey);
      default:
        throw new Error(`Unknown provider: ${providerCode}`);
    }
  }
}