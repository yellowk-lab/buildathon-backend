import { default as validateEmail } from 'validator/lib/isEmail';

export function isEmail(value: string): boolean {
  return validateEmail(value);
}
