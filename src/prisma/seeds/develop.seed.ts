import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { UniqueEnforcer } from 'enforce-unique';
import * as moment from 'moment';
import _ from 'lodash';
import { generateRandomLocations } from './utils';

const prisma = new PrismaClient();
const uniqueEnforcerEmail = new UniqueEnforcer();
const uniqueEnforcerId = new UniqueEnforcer();

export const main = async () => {
  console.log('Seeding develop...');
  try {
    await seedUsers();
    await seedEvents();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

const seedUsers = async () => {
  const users = [];
  const randomUser = 10;
  for (let i = 0; i < randomUser; i++) {
    users.push(createRandomUser());
  }
  const totalUsers = await prisma.user.createMany({ data: users });
  console.log(`Created ${totalUsers.count} users`);
};

const seedEvents = async () => {
  const lootBoxes = await generateLootBoxes(10);
  const createdEvents = await prisma.event.create({
    data: {
      name: 'Block Party SF - 15th June',
      brand: 'Based Block Party',
      description:
        'The first based block party that will take place in Crissy Field SF!',
      startDate: moment().toDate(),
      endDate: moment().add(14, 'd').toDate(),
      lootBoxes: {
        create: lootBoxes,
      },
    },
  });
  console.log(createdEvents);
};

const generateLootBoxes = async (amount: number) => {
  const centerLatitude = 37.8042;
  const centerLongitude = -122.4597;
  const radiusInMeters = 2000;
  const locations = generateRandomLocations(
    centerLatitude,
    centerLongitude,
    radiusInMeters,
    amount,
  );

  const loot = await prisma.loot.create({
    data: {
      name: 'apple-gift-card-25',
      displayName: 'Apple Gift Card - 25$',
      imageUrl: 'https://picsum.photos/seed/picsum/450/300',
      totalSupply: 100,
      circulatingSupply: 0,
    },
  });

  return locations.map((location) => {
    return {
      lootClaimed: false,
      loot: {
        connect: {
          id: loot.id,
        },
      },
      location: {
        create: {
          address: '',
          positionName: '',
          latitude: location.latitude,
          longitude: location.longitude,
        },
      },
    };
  });
};

const createRandomUser = () => ({
  id: uniqueEnforcerId.enforce(() => {
    return faker.string.uuid();
  }),
  email: uniqueEnforcerEmail.enforce(() => {
    return faker.internet.email().toLowerCase();
  }),
});
