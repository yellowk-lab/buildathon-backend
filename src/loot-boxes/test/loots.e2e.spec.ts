import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest-graphql';
import { faker } from '@faker-js/faker';
import {
  generateFakeLoot,
  GET_LOOT,
  GET_LOOTS,
  GET_TOTAL_UNCLAIMED_LOOTS,
} from './test.utils';

import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { LootsService } from '../loots/loots.service';

describe('Loot e2e test features', () => {
  let app: INestApplication;
  let lootsService: LootsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    lootsService = module.get<LootsService>(LootsService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await app.close();
  });

  it('should return an array with all the loots with their total supply and claimed supply', async () => {
    const totalLoots = faker.number.int({ min: 3, max: 20 });
    const mockedLoots = [];
    for (let i = 0; i < totalLoots; i++) {
      mockedLoots.push(generateFakeLoot({ id: i }));
    }
    lootsService.findAll = jest.fn().mockResolvedValue(mockedLoots);
    lootsService.countClaimedById = jest.fn().mockImplementation((lootId) => {
      const loot = mockedLoots.find((loot) => lootId === loot.id);
      return loot.claimedSupply;
    });
    const response = await request<{ loots: string }>(app.getHttpServer())
      .query(GET_LOOTS)
      .expectNoErrors();
    expect(response.data.loots).toEqual(mockedLoots);
    expect(response.data.loots.length).toEqual(mockedLoots.length);
  });
  it('should return a loot corresponding to specific id', async () => {
    const randomId = faker.number.int({ min: 1, max: 1000000 });
    const mockedLoot = generateFakeLoot({ id: randomId });
    lootsService.findOneById = jest.fn().mockResolvedValue(mockedLoot);
    lootsService.countClaimedById = jest
      .fn()
      .mockResolvedValue(mockedLoot.claimedSupply);
    const response = await request<{ loot: string }>(app.getHttpServer())
      .query(GET_LOOT)
      .variables({ id: randomId })
      .expectNoErrors();

    expect(response.data.loot).toEqual(mockedLoot);
  });

  it('should return the total supply of unclaimed loot', async () => {
    const totalLoots = faker.number.int({ min: 3, max: 20 });
    const mockedLoots = [];
    let allLootsClaimedSupply = 0;
    let allLootsTotalSupply = 0;
    for (let i = 0; i < totalLoots; i++) {
      const loot = generateFakeLoot({ id: i });
      allLootsClaimedSupply += loot.claimedSupply;
      allLootsTotalSupply += loot.totalSupply;
      mockedLoots.push(loot);
    }
    const expectedAllLootsUnclaimedSupply =
      allLootsTotalSupply - allLootsClaimedSupply;
    lootsService.findAll = jest.fn().mockResolvedValue(mockedLoots);
    lootsService.getLootsTotalSupplySum = jest
      .fn()
      .mockResolvedValue(allLootsTotalSupply);
    lootsService.countClaimedById = jest.fn().mockImplementation((lootId) => {
      const loot = mockedLoots.find((loot) => lootId === loot.id);
      return loot.claimedSupply;
    });
    const response = await request<{ totalUnclaimedLoots: string }>(
      app.getHttpServer(),
    )
      .query(GET_TOTAL_UNCLAIMED_LOOTS)
      .expectNoErrors();
    expect(response.data.totalUnclaimedLoots).toEqual(
      expectedAllLootsUnclaimedSupply,
    );
  });
});
