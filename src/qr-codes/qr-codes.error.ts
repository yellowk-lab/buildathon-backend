import { BaseError } from '../errors';

export class QRCodesError extends BaseError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}
