import { BaseError } from '../errors';

export class SaleError extends BaseError {
  static CREATE_FAILED = 'CREATE_FAILED';

  constructor(code?: string, message?: string) {
    super(code, message);
  }
}
