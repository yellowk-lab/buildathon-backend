import { PrismaClient } from '@prisma/client';
import { crates } from './crates-geolocations';
import { hashes } from './qr-code-hashes';
import { loots } from './loots';

const prisma = new PrismaClient();

export const main = async () => {
  console.log('Seeding production...');
  try {
    await seedTable('qRCode', hashes);
    await seedTable(
      'crate',
      crates?.map((crate, i) => ({
        address: crate.Address,
        positionName: crate.PositionName,
        latitude: parseFloat(crate.Latitude),
        longitude: parseFloat(crate.Longitude),
      })),
    );
    await seedTable('loot', loots);
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

  await prisma[name].createMany({
    data,
  });
  console.log(`Added ${name} data`);
};
