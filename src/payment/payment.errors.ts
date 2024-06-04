import { BaseError } from '../errors';

export class PaymentError extends BaseError {
  static PAYMENT_INTENT_CREATION_FAILED = 'PAYMENT_INTENT_CREATION_FAILED';
  static PAYMENT_NOT_SUCCEEDED = 'PAYMENT_NOT_SUCCEDED';
  static MISSING_METADATA = 'MISSING_METADATA';
  static PRODUCT_PAYMENT_MISMATCH = 'PRODUCT_PAYMENT_MISMATCH';
  static NO_STRIPE_ACCOUNT = 'NO_STRIPE_ACCOUNT';
  static KYC_NOT_COMPLETED = 'KYC_NOT_COMPLETED';
  static NO_FUNDS_TO_CASHOUT = 'NO_FUNDS_TO_CASHOUT';

  constructor(code?: string, message?: string) {
    super(code, message);
  }
}
