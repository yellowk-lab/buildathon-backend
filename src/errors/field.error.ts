import { GraphQLError } from 'graphql';
import {
  GENERAL_CODES_ERRORS,
  EMAIL_CODES_ERRORS,
  PASSWORD_CODES_ERRORS,
  DATE_CODES_ERRORS,
} from './fields-codes';
import { ApolloServerErrorCode } from '@apollo/server/errors';

export class FieldError extends GraphQLError {
  static GENERAL_CODES = GENERAL_CODES_ERRORS;
  static SERVER_CODES = ApolloServerErrorCode;
  static EMAIL_CODES = EMAIL_CODES_ERRORS;
  static PASSWORD_CODES = PASSWORD_CODES_ERRORS;
  static DATE_CODES_ERRORS = DATE_CODES_ERRORS;

  constructor(
    code: string,
    message: string,
    fields: Record<string, string>,
    options?: Record<string, any>,
  ) {
    super(message, {
      extensions: {
        code: code,
        fields: fields,
        ...options,
      },
    });
    this.name = this.constructor.name;
  }

  get type() {
    return this.name;
  }
}
