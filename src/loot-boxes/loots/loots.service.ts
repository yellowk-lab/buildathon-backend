import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Loot } from '../entities/loot.entity';
import { LootsError } from './loots.error';

@Injectable()
export class LootsService {
  constructor(readonly prisma: PrismaService) {}

  async createLoots(
    lootsDistribution: {
      name: string;
      displayName: string;
      imageUrl: string;
      amount: number;
    }[],
  ): Promise<Loot[]> {
    const createdLoots = await Promise.all(
      lootsDistribution.map(async (lootDistribution) => {
        const loot = await this.prisma.loot.create({
          data: {
            name: lootDistribution.name,
            displayName: lootDistribution.displayName,
            imageUrl: lootDistribution.imageUrl,
            totalSupply: lootDistribution.amount,
          },
        });
        return loot;
      }),
    );
    return createdLoots.map(Loot.create);
  }

  async findAll(): Promise<Loot[]> {
    const loots = await this.prisma.loot.findMany();
    return loots.map(Loot.create);
  }

  async findOneById(id: string): Promise<Loot> {
    try {
      const loot = await this.prisma.loot.findUnique({ where: { id } });
      return Loot.create(loot);
    } catch (error) {
      throw new LootsError(LootsError.NOT_FOUND, 'Loot not found');
    }
  }

  async getOneById(id: string): Promise<Loot | null> {
    try {
      return await this.findOneById(id);
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

  async countClaimedById(lootId: string): Promise<number> {
    return await this.prisma.lootBox.count({
      where: {
        loot: {
          id: lootId,
        },
        lootClaimed: true,
      },
    });
  }

  async computeCirculatingSupply(loot: Loot): Promise<number> {
    const totalAssignedToBox = await this.prisma.lootBox.count({
      where: { lootId: loot.id },
    });
    return loot.totalSupply - totalAssignedToBox;
  }

  async incrementCirculatingSupply(id: string): Promise<Loot> {
    const updatedLoot = await this.prisma.loot.update({
      where: { id },
      data: {
        circulatingSupply: {
          increment: 1,
        },
      },
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
