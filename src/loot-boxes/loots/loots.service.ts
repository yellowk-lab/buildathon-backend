import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Loot } from '../entities/loot.entity';
import { LootsError } from './loots.error';
import { LootDistribution } from '../dto/loot-distribution.input';

@Injectable()
export class LootsService {
  constructor(readonly prisma: PrismaService) {}

  async createLoots(lootsDistribution: LootDistribution[]): Promise<Loot[]> {
    const createdLoots = await Promise.all(
      lootsDistribution.map(async (lootDistribution) => {
        const loot = await this.prisma.loot.create({
          data: {
            name: lootDistribution.name,
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
}
