import { BaseError, FieldError } from '../errors';

export class LootBoxesError extends BaseError {
  static NO_LOOT_TO_CLAIM = 'NO_LOOT_TO_CLAIM';
  static ALREADY_CLAIMED = 'ALREADY_CLAIMED';
  static NOT_WITHIN_COORDINATES_RANGE = 'NOT_WITHIN_COORDINATES_RANGE';
  static LOCATION_MISSING = 'LOCATION_MISSING';

  constructor(code: string, message: string) {
    super(code, message);
  }
}

export class LootBoxesFieldsError extends FieldError {
  constructor(code: string, message: string, fields: Record<string, string>) {
    super(code, message, fields);
  }
}
