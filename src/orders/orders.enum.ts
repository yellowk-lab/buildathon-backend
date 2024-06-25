import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'The supported status for order',
  valuesMap: {
    PENDING: {
      description: 'The default status when created',
    },
  },
});
