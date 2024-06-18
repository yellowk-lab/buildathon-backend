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

export function getRandomCoordinates(
  lat: number,
  lon: number,
  radiusInMeters: number,
) {
  const radiusInDegrees = radiusInMeters / 111300;

  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const deltaLat = w * Math.cos(t);
  const deltaLon = (w * Math.sin(t)) / Math.cos(lat * (Math.PI / 180));

  const newLat = lat + deltaLat;
  const newLon = lon + deltaLon;

  return { latitude: newLat, longitude: newLon };
}

export function generateRandomLocations(
  centerLat: number,
  centerLon: number,
  radiusInMeters: number,
  numberOfLocations: number,
): Geocoordinates[] {
  const locations = [];
  for (let i = 0; i < numberOfLocations; i++) {
    locations.push(getRandomCoordinates(centerLat, centerLon, radiusInMeters));
  }
  return locations;
}

interface Geocoordinates {
  latitude: number;
  longitude: number;
}
