import { BaseError, FieldError as BaseFieldError } from '../errors';

export class ProductError extends BaseError {
  constructor(code?: string, message?: string) {
    super(code, message);
  }
}

export class ProductFieldError extends BaseFieldError {
  static FILE_HASH_NOT_UNIQUE = 'FILE_HASH_NOT_UNIQUE';
  static MINIMUM_PRICE_LIMIT = 'MINIMUM_PRICE_LIMIT';

  constructor(code: string, message: string, fields: Record<string, any>) {
    super(code, message, fields);
  }
}
