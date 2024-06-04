import { BaseError } from '../errors';

export class AuthError extends BaseError {
  static WRONG_CREDENTIALS = 'WRONG_CREDENTIALS';
  static REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED';
  static UNAUTHORIZED = 'UNAUTHORIZED';

  constructor(code: string, message: string) {
    super(code, message);
  }
}
