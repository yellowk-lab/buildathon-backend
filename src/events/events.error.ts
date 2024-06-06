import { BaseError, FieldError } from '../errors';

export class EventsError extends BaseError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}

export class EventsFieldsError extends FieldError {
  constructor(code: string, message: string, fields: Record<string, string>) {
    super(code, message, fields);
  }
}
