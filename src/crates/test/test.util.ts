import gql from 'graphql-tag';
import { faker } from '@faker-js/faker';
import { Crate } from '../entities/crate.entity';

export const GET_CRATES = gql`
  query GetCrates($take: Int, $skip: Int) {
    crates(take: $take, skip: $skip) {
      id
      address
      positionName
      latitude
      longitude
      qrCodeId
    }
  }
`;

export const GET_CRATE = gql`
  query GetCrate($id: Int!) {
    crate(id: $id) {
      id
      address
      positionName
      latitude
      longitude
      qrCodeId
    }
  }
`;

export function generateFakeCrate(overrides?: Partial<Crate>): Crate {
  const crate: Crate = {
    id: faker.number.int({ min: 1, max: 10000000 }),
    positionName: faker.location.street().toUpperCase(),
    address: faker.location.streetAddress(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    qrCodeId: faker.number.int({ min: 1, max: 10000000 }),
    ...overrides,
  };
  return crate;
}
