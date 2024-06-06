import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { crates } from './crates-geolocations';
import { hashes } from './qr-code-hashes';
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

    await seedTable(
      'crate',
      crates?.map((crate, i) => ({
        address: crate.Address,
        positionName: crate.PositionName,
        latitude: parseFloat(crate.Latitude),
        longitude: parseFloat(crate.Longitude),
        qrCodeId: Math.random() > 0.5 ? i + 1 : null,
      }))
    );
    await prisma.lootBox.deleteMany();
    const createdEvents = await seedTable('event', [
      {
        name: 'Test Event',
        startDate: new Date(),
        endDate: new Date('December 31, 2023 23:59:59'),
      },
    ]);
    const createdLoots = await seedTable('loot', loots);
    const lootBoxes = generateLootBoxes(
      createdLoots,
      3200,
      1000,
      createdEvents[0]?.id
    );
    const createdLootBoxes = await seedTable('lootBox', lootBoxes, false);
    for (let i = 0; i < createdQRCodes.length; i++) {
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
  sequenceStartAt = 1
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
  eventId: string | number
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
