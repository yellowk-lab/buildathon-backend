import { BaseError } from '../../errors';

export class LootsError extends BaseError {
  static NO_SUPPLY_LEFT = 'NO_SUPPLY_LEFT';

  constructor(code: string, message: string) {
    super(code, message);
  }
}
