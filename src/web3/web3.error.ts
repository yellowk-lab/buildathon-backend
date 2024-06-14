import { BaseError } from '../errors';

export class Web3Error extends BaseError {
  static TRANSACTION_FAILED = 'TRANSACTION_FAILED';

  constructor(code: string, message: string) {
    super(code, message);
  }
}

