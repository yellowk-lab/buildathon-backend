import { BaseError } from '../errors';

export class CratesError extends BaseError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}
