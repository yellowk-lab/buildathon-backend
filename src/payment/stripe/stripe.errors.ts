import { BaseError, FieldError } from '../../errors';
export class StripeError extends BaseError {
  static MESSAGE_SIGNATURE_VERIFICATION_FAILED =
    'MESSAGE_SIGNATURE_VERIFICATION_FAILED';
  static API_CALL_ERROR = 'API_CALL_ERROR';

  constructor(code?: string, message?: string) {
    super(code, message);
  }
}

export class StripeFieldError extends FieldError {
  constructor(code: string, message: string, fields: Record<string, any>) {
    super(code, message, fields);
  }
}
