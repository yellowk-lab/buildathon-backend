import {
  CountryCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/mobile';

export function standardizePhoneNumber(
  phoneNumber: string,
  country: CountryCode = 'CH',
): string | null {
  try {
    const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, country);
    if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
      return parsedPhoneNumber.format('E.164');
    }
    return null;
  } catch {
    return null;
  }
}
