import { BaseError } from '../errors';

export class DigitalOceanError extends BaseError {
  static INVALID_FILE_EXTENSION = 'INVALID_FILE_EXTENSION';
  constructor(
    code: string = BaseError.SERVER_CODES.INTERNAL_SERVER_ERROR,
    message = 'Internal Server Error',
  ) {
    super(code, message);
  }
}
