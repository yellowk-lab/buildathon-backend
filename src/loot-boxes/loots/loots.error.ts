import { BaseError} from '../../errors';

export class LootsError extends BaseError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}

