import { BaseError } from '../errors';

export class LocationsError extends BaseError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}
