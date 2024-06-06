import gql from 'graphql-tag';
import { faker } from '@faker-js/faker';
import { Loot } from '../entities/loot.entity';

export const GET_LOOTS = gql`
  query GetLoots {
    loots {
      id
      name
      displayName
      totalSupply
      circulatingSupply
      claimedSupply
    }
  }
`;
export const GET_LOOT = gql`
  query GetLoot($id: Int!) {
    loot(id: $id) {
      id
      name
      displayName
      totalSupply
      circulatingSupply
      claimedSupply
    }
  }
`;
export const GET_TOTAL_UNCLAIMED_LOOTS = gql`
  query getTotalUnclaimedSupply {
    totalUnclaimedLoots
  }
`;

export function generateFakeLoot(overrides?: Partial<Loot>): Loot {
  const totalSupply = faker.number.int({ min: 10, max: 100 });
  const circulatingSupply = faker.number.int({ min: 0, max: totalSupply });
  const claimedSupply = faker.number.int({ min: 0, max: totalSupply });
  const loot: Loot = {
    id: faker.number.int({ min: 1, max: 10000000 }),
    name: faker.commerce.product(),
    displayName: faker.commerce.productName(),
    totalSupply: totalSupply,
    circulatingSupply: circulatingSupply,
    claimedSupply: claimedSupply,
    ...overrides,
  };
  return loot;
}
