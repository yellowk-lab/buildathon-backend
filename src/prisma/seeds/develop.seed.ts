import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { UniqueEnforcer } from 'enforce-unique';
import * as moment from 'moment';
import _ from 'lodash';
import { generateRandomLocations } from './utils';

const prisma = new PrismaClient();
const uniqueEnforcerEmail = new UniqueEnforcer();
const uniqueEnforcerId = new UniqueEnforcer();
const uniqueEnforcerWallet = new UniqueEnforcer();

const LOOT_BOXES_AMOUNT_TO_GEN = 50;
const USERS_AMOUNT_TO_GEN = 10;
const CENTER_LONGITUDE = -122.4597;
const CENTER_LATITUDE = 37.8042;
const CENTER_RADIUS = 1000;

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
  const randomUser = USERS_AMOUNT_TO_GEN;
  for (let i = 0; i < randomUser; i++) {
    users.push(createRandomUser());
  }
  const totalUsers = await prisma.user.createMany({ data: users });
  console.log(`Created ${totalUsers.count} users`);
};

const seedEvents = async () => {
  const lootBoxes = await generateLootBoxes(LOOT_BOXES_AMOUNT_TO_GEN);
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
      status: 'ACTIVE',
    },
  });
  console.log(createdEvents);
};

const generateLootBoxes = async (amount: number) => {
  const centerLatitude = CENTER_LATITUDE;
  const centerLongitude = CENTER_LONGITUDE;
  const radiusInMeters = CENTER_RADIUS;
  const locations = generateRandomLocations(
    centerLatitude,
    centerLongitude,
    radiusInMeters,
    amount,
  );

  const loot = await prisma.loot.create({
    data: {
      name: 'apple-gift-card-25',
      imageUrl:
        'https://buildathon.nyc3.cdn.digitaloceanspaces.com/based-block-party/img/apple-gift-card-25.png',
      totalSupply: 100,
      circulatingSupply: 0,
    },
  });

  return locations.map((location) => {
    return {
      loot: {
        connect: {
          id: loot.id,
        },
      },
      location: {
        create: {
          address: faker.location.streetAddress(),
          positionName: faker.location.street(),
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
  walletAddress: uniqueEnforcerWallet.enforce(() => {
    return faker.finance.ethereumAddress();
  }),
});
