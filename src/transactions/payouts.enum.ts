import { registerEnumType } from '@nestjs/graphql';

export enum PayoutStatus {
  paid = 'Paid',
  pending = 'Pending',
  in_transit = 'InTransit',
  canceled = 'Canceled',
  failed = 'Failed',
}

registerEnumType(PayoutStatus, {
  name: 'PayoutStatus',
  description: 'The stripe status of a payout',
});
