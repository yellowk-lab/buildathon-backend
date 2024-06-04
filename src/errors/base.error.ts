import { GraphQLError } from 'graphql';
import { ApolloServerErrorCode } from '@apollo/server/errors';

export class BaseError extends GraphQLError {
  static SERVER_CODES = ApolloServerErrorCode;
  static FORBIDDEN = 'FORBIDDEN';
  static NOT_FOUND = 'NOT_FOUND';

  constructor(
    code: string = BaseError.SERVER_CODES.INTERNAL_SERVER_ERROR,
    message = 'Internal server error',
    options?: Record<string, any>,
  ) {
    super(message, {
      extensions: {
        code: code,
        ...options,
      },
    });
    this.name = this.constructor.name;
  }

  get type() {
    return this.name;
  }
}
