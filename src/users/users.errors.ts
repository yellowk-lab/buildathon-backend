import { BaseError, FieldError as BaseFieldError } from '../errors';

export class UserError extends BaseError {
  static USER_CREATION = 'USER_CREATION';
  static UNAUTHORIZED = 'UNAUTHORIZED';

  constructor(code: string, message: string) {
    super(code, message);
  }
}

export class UserFieldError extends BaseFieldError {
  constructor(code: string, message: string, fields: Record<string, any>) {
    super(code, message, fields);
  }
}
