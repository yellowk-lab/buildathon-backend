import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const seedTable = async (
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
