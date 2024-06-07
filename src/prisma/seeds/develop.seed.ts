import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hashes } from './qr-code-hashes';
import * as moment from 'moment';
import { loots } from './loots';
import { UniqueEnforcer } from 'enforce-unique';
import _ from 'lodash';

const prisma = new PrismaClient();
const uniqueEnforcerEmail = new UniqueEnforcer();
const uniqueEnforcerId = new UniqueEnforcer();

export const main = async () => {
  console.log('Seeding develop...');
  try {
    const createdQRCodes = await seedTable('qRCode', hashes);

    const users = [];
    const randomUser = 10;
    for (let i = 0; i < randomUser; i++) {
      users.push(createRandomUser());
    }
    const totalUsers = await prisma.user.createMany({ data: users });
    console.log(`Created ${totalUsers.count} users`);
    const fakerCrates = [];
    const randomCrates = faker.number.int({ min: 300, max: 1000 });
    for (let i = 0; i < randomCrates; i++) {
      fakerCrates.push({
        address: faker.location.streetAddress(true),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        positionName: faker.lorem.sentence({ min: 2, max: 4 }),
      });
    }
    await seedTable('crate', fakerCrates);
    await prisma.lootBox.deleteMany();
    moment.locale('en');
    const now = moment.now();
    const createdEvents = await seedTable('event', [
      {
        name: 'Base On Chain Summer',
        startDate: moment(now).toDate(),
        endDate: moment(now).add(7, 'd').toDate(),
      },
      {
        name: 'Futur Event',
        startDate: moment(now).add(7, 'd').toDate(),
        endDate: moment(now).add(8, 'd').toDate(),
      },
    ]);
    const createdLoots = await seedTable('loot', loots);
    const lootBoxes = generateLootBoxes(
      createdLoots,
      createdQRCodes.length,
      50,
      createdEvents[0]?.id,
    );
    const createdLootBoxes = await seedTable('lootBox', lootBoxes, false);
    let qrCodeErrorCounter = 0;
    let lootBoxErrorCounter = 0;
    for (let i = 0; i < createdQRCodes.length; i++) {
      if (!createdQRCodes[i] || createdQRCodes[i].id === undefined) {
        qrCodeErrorCounter++;
        continue;
      }
      if (!createdLootBoxes[i] || createdLootBoxes[i].id === undefined) {
        lootBoxErrorCounter++;
        continue;
      }

      await prisma.qRCode.update({
        where: {
          id: createdQRCodes[i].id,
        },
        data: {
          lootBoxes: {
            connect: [{ id: createdLootBoxes[i].id }],
          },
        },
      });
    }
    console.log(
      `Encountered ${qrCodeErrorCounter} errors with QR Code,\nTotal qr codes is ${createdQRCodes.length}`,
    );
    console.log(
      `Encountered ${lootBoxErrorCounter} errors with Lootbox,\nTotal lootboxes is ${createdLootBoxes.length}`,
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

const seedTable = async (
  name: string,
  data: any,
  isSequence = true,
  sequenceStartAt = 1,
) => {
  await prisma[name].deleteMany();
  console.log(`Deleted records in ${name} table`);

  if (isSequence) {
    const SEQUENCE_RESTART_QUERY = `ALTER SEQUENCE "${
      name.charAt(0).toUpperCase() + name.slice(1)
    }_id_seq" RESTART WITH ${sequenceStartAt}`;
    await prisma.$queryRawUnsafe(SEQUENCE_RESTART_QUERY);
    console.log(`Reset ${name} auto increment to ${sequenceStartAt}`);
  }

  const creation = await prisma[name].createMany({
    data,
  });
  console.log(`Created ${creation?.count} records in ${name} table`);
  return await prisma[name].findMany();
};

type Loot = {
  id: number;
  name: string;
};

type LootBox = {
  eventId: string | number;
  lootId?: string | number;
  isOpened?: boolean;
};

function generateLootBoxes(
  loots: Loot[],
  totalBoxes: number,
  boxesWithLoot: number,
  eventId: string | number,
): LootBox[] {
  // Randomly select which boxes get a loot
  const lootIndices = new Set<number>();
  while (lootIndices.size < boxesWithLoot) {
    const randomIndex = Math.floor(Math.random() * totalBoxes);
    lootIndices.add(randomIndex);
  }

  const lootboxes: LootBox[] = [];

  for (let i = 0; i < totalBoxes; i++) {
    const lootbox: LootBox = {
      eventId,
    };

    // Assign a random loot to the boxes we selected to have loot
    if (lootIndices.has(i)) {
      const randomLootIndex = Math.floor(Math.random() * loots.length);
      lootbox.lootId = loots[randomLootIndex].id;
      lootbox.isOpened = Math.random() > 0.2;
    }

    lootboxes.push(lootbox);
  }

  return lootboxes;
}

const createRandomUser = () => ({
  id: uniqueEnforcerId.enforce(() => {
    return faker.number.int({ max: 1000000 });
  }),
  email: uniqueEnforcerEmail.enforce(() => {
    return faker.internet.email().toLowerCase();
  }),
});
