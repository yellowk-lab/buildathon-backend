import { faker } from '@faker-js/faker';
import { UniqueEnforcer } from 'enforce-unique';
import { prisma } from './utils';
import * as moment from 'moment-timezone';

const uniqueEnforcerEmail = new UniqueEnforcer();

const STRIPE_PRODUCT_ID = 'prod_P9IL9tdnof7x6Y';

export const main = async () => {
  console.log('Seeding develop...');
  try {
    // Users
    const users = [];
    const randomUser = 5;
    for (let i = 0; i < randomUser; i++) {
      users.push(createRandomUser());
    }

    await prisma.user.createMany({ data: users });
    const contentCreator = await prisma.user.findFirst();
    await prisma.product.create({
      data: {
        name: faker.commerce.product.name,
        currency: faker.finance.currencyCode(),
        price: faker.number.int({ min: 500, max: 10000 }),
        fileStorageHash: faker.string.nanoid(),
        stripeProductId: STRIPE_PRODUCT_ID,
        creatorId: contentCreator.id,
      },
    });
    const startDate = moment.tz(Date.now(), 'Europe/Zurich').format();
    console.log('Date start: ', startDate);
    const endDate = moment
      .tz(faker.date.future({ years: 2 }), 'Europe/Zurich')
      .format();

    // Platform fees
    await prisma.platformFeeConfig.create({
      data: {
        percentage: 20,
        startDate,
        endDate,
      },
    });
    // Referral fees
    const referralFee = await prisma.referralFeeConfig.create({
      data: {
        percentage: 10,
        startDate,
        endDate,
      },
    });

    // User with referrer and product
    const someUser = await prisma.user.findFirst({ skip: 2 });
    await prisma.user.update({
      where: { id: someUser.id },
      data: { referrerId: contentCreator.id, referrerFeeId: referralFee.id },
    });
    await prisma.product.create({
      data: {
        name: faker.commerce.product.name,
        currency: faker.finance.currencyCode(),
        price: faker.number.int({ min: 500, max: 10000 }),
        fileStorageHash: faker.string.nanoid(),
        stripeProductId: faker.string.nanoid(),
        creatorId: someUser.id,
      },
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

const createRandomUser = () => ({
  email: uniqueEnforcerEmail.enforce(() => {
    return faker.internet.email().toLowerCase();
  }),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  country: faker.location.countryCode('alpha-2'),
  tosAccepted: faker.datatype.boolean(1),
  referralCode: faker.string.nanoid(),
});
