import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest-graphql';
import { faker } from '@faker-js/faker';
import {
  generateFakeCrate,
  GET_CRATE,
  GET_CRATES,
} from './test.utils';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('Crate e2e test features', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await app.close();
  });

  it('should return an array with all the crates', async () => {
    const totalCrates = faker.number.int({ min: 3, max: 20 });
    const mockedCrates = [];
    for (let i = 0; i < totalCrates; i++) {
      mockedCrates.push(generateFakeCrate({ id: i }));
    }
    prisma.crate.findMany = jest.fn().mockResolvedValue(mockedCrates);
    const response = await request<{ crates: string }>(app.getHttpServer())
      .query(GET_CRATES)
      .expectNoErrors();
    expect(response.data.crates).toEqual(mockedCrates);
    expect(response.data.crates.length).toEqual(mockedCrates.length);
  });
  it('should return a crate corresponding to specific id', async () => {
    const randomId = faker.number.int({ min: 1, max: 1000000 });
    const mockedCrate = generateFakeCrate({ id: randomId });
    prisma.crate.findUniqueOrThrow = jest
      .fn()
      .mockResolvedValue(mockedCrate);
    const response = await request<{ crate: string }>(app.getHttpServer())
      .query(GET_CRATE)
      .variables({ id: randomId })
      .expectNoErrors();

    expect(response.data.crate).toEqual(mockedCrate);
  });
});
