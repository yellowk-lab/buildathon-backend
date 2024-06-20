import { BaseError } from '../errors';

export class MailError extends BaseError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}
