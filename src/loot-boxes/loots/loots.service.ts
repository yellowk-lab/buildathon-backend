import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Loot } from '../entities/loot.entity';
import { LootsError } from './loots.error';

@Injectable()
export class LootsService {
  constructor(readonly prisma: PrismaService) {}

  async findAll(): Promise<Loot[]> {
    const loots = await this.prisma.loot.findMany();
    return loots.map(Loot.create);
  }

  async findOneById(id: number): Promise<Loot> {
    try {
      const loot = await this.prisma.loot.findUnique({ where: { id } });
      return Loot.create(loot);
    } catch (error) {
      throw new LootsError(LootsError.NOT_FOUND, 'Loot not found');
    }
  }

  async getOneById(id: number): Promise<Loot | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  async getOneByName(name: string): Promise<Loot | null> {
    try {
      const loot = await this.prisma.loot.findUniqueOrThrow({
        where: { name },
      });
      return loot;
    } catch (error) {
      return null;
    }
  }

  async getTotalClaimedSupply(): Promise<number> {
    const loots = await this.findAll();
    let claimedSupplySum: number = 0;
    for (let i = 0; i < loots.length; i++) {
      const count = await this.countClaimedById(loots[i].id);
      claimedSupplySum += count;
    }
    return claimedSupplySum;
  }

  async getLootsTotalSupplySum(): Promise<number> {
    const totalLootsSupply = await this.prisma.loot.aggregate({
      _sum: { totalSupply: true },
    });
    return totalLootsSupply._sum.totalSupply;
  }

  async getTotalUnclaimedSupply(): Promise<number> {
    const totalClaimedSupply = await this.getTotalClaimedSupply();
    const lootsTotalSupply = await this.getLootsTotalSupplySum();
    return lootsTotalSupply - totalClaimedSupply;
  }

  async countClaimedById(lootId: number): Promise<number> {
    return await this.prisma.lootBox.count({
      where: {
        loot: {
          id: lootId,
        },
        isOpened: true,
      },
    });
  }

  async computeCirculatingSupply(loot: Loot): Promise<number> {
    const totalAssignedToBox = await this.prisma.lootBox.count({
      where: { lootId: loot.id },
    });
    return loot.totalSupply - totalAssignedToBox;
  }

  async updateCirculatingSupply(
    lootId: number,
    circulatingSupply: number,
  ): Promise<Loot> {
    const updatedLoot = await this.prisma.loot.update({
      where: { id: lootId },
      data: { circulatingSupply },
    });
    return Loot.create(updatedLoot);
  }

  async verifyDistributionAvailability(
    loot: Loot,
    quantity: number,
  ): Promise<boolean> {
    const computedSupply = await this.computeCirculatingSupply(loot);
    return computedSupply >= quantity;
  }
}
