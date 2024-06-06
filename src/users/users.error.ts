import { BaseError, FieldError } from '../errors';

export class UsersError extends BaseError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}

export class UsersFieldError extends FieldError {
  constructor(code: string, message: string, fields: Record<string, string>) {
    super(code, message, fields);
  }
}
