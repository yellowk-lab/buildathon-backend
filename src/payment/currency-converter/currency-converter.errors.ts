import { BaseError, FieldError } from '../../errors';
export class CurrencyConverterError extends BaseError {
  static API_CALL_ERROR = 'API_CALL_ERROR';

  constructor(code?: string, message?: string) {
    super(code, message);
  }
}
