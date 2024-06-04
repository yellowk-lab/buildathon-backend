import { PrismaClient } from '@prisma/client';
import * as moment from 'moment-timezone';

const prisma = new PrismaClient();

export const main = async () => {
  console.log('Seeding production...');
  try {
    const today = moment.utc(Date.now()).tz('Europe/Zurich');
    const startDate = today.format();
    const endDate = today.add(10, 'years').format();
    const platformFee = await prisma.platformFeeConfig.create({
      data: {
        percentage: 20,
        startDate,
        endDate,
      },
    });
    const referralFee = await prisma.referralFeeConfig.create({
      data: {
        percentage: 10,
        startDate,
        endDate,
      },
    });
    console.log(`Default platform fee rate: ${platformFee.percentage}`);
    console.log(`Default referral fee rate: ${referralFee.percentage}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};
