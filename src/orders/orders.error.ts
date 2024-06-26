import { BaseError } from '../errors';

export class OrdersError extends BaseError {
  static TRANSACTION_HASH_ALREADY_EXIST = 'TRANSACTION_HASH_ALREADY_EXIST';
  static TOKEN_TRANSFER_NOT_VALID = 'TOKEN_TRANSFER_NOT_VALID';
  static TOKEN_OWNER_DIFFERENT_FROM_WALLET =
    'TOKEN_OWNER_DIFFERENT_FROM_WALLET';
  static DELIVERY_ADDRESS_NOT_FOUND = 'DELIVERY_ADDRESS_NOT_FOUND';

  constructor(code: string, message: string) {
    super(code, message);
  }
}
