import { BaseError } from '../errors';

export class CoreError extends BaseError {
  static MOMENT_DATE_TIME = 'MOMENT_DATE_TIME';

  constructor(code: string, message: string) {
    super(code, message);
  }
}
