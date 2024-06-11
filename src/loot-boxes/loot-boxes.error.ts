import { BaseError, FieldError } from '../errors';

export class LootBoxesError extends BaseError {
  static ALREADY_CLAIMED = 'ALREADY_CLAIMED';

  constructor(code: string, message: string) {
    super(code, message);
  }
}

export class LootBoxesFieldsError extends FieldError {
  constructor(code: string, message: string, fields: Record<string, string>) {
    super(code, message, fields);
  }
}
