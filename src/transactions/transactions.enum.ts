import { registerEnumType } from '@nestjs/graphql';

export enum TransactionType {
  PlatformFee,
  ReferralFee,
  CreatorEarnings,
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'The type of transaction registered',
});

export enum TransactionStatus {
  Pending,
  Processed,
  InProgress,
  AwaitingPayout,
  Failed,
}

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
  description: 'The status in which the transaction is currently',
});
