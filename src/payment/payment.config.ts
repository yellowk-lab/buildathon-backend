import { ConfigService } from '@nestjs/config';

export default {
  countries: {
    unavailable: [
      'AU', // Australia
      'CA', // Canada
      'HK', // Hong Kong SAR China
      'JP', // Japan
      'MX', // Mexico
      'NZ', // New Zealand
      'SG', // Singapore
      'TH', // Thailand
      'AE', // United Arab Emirates
      'US', // United States
    ],
  },
  currencies: {
    available: ['CHF', 'EUR', 'USD', 'GBP'],
  },
  stripe: {
    expressFees: {
      percentage: 0.0025,
      fix: 55,
    },
  },
};
