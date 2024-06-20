import { registerEnumType } from '@nestjs/graphql';

export enum EventStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

registerEnumType(EventStatus, {
  name: 'EventStatus',
  description: 'The supported status for each event',
  valuesMap: {
    CREATED: {
      description: 'The default status',
    },
  },
});
