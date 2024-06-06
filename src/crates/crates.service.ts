import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Crate } from './entities/crate.entity';
import { CratesError } from './crates.error';
import {
  calculateDistance,
  GeographicCoordinate,
} from '../common/utils/geolocalisation.util';

@Injectable()
export class CratesService {
  constructor(readonly prisma: PrismaService) {}

  async findAll(take?: number, skip?: number): Promise<Crate[]> {
    const crates = await this.prisma.crate.findMany({
      take: take,
      skip: skip,
    });
    return crates.map(Crate.create);
  }

  async findOneById(id: number): Promise<Crate> {
    try {
      const crate = await this.prisma.crate.findUniqueOrThrow({
        where: { id },
      });
      return Crate.create(crate);
    } catch (error) {
      throw new CratesError(CratesError.NOT_FOUND, 'Crate not found');
    }
  }

  async getOneById(id: number): Promise<Crate | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  async findClosestToTargetCoordinate(
    targetCoordinate: GeographicCoordinate,
  ): Promise<Crate | null> {
    const allCrates = await this.findAll();
    if (allCrates.length === 0) {
      return null;
    }
    let closestCrate = allCrates[0];
    let closestDistance = calculateDistance(targetCoordinate, {
      lat: closestCrate.latitude,
      lng: closestCrate.longitude,
    });
    for (const crate of allCrates) {
      const distance = calculateDistance(targetCoordinate, {
        lat: crate.latitude,
        lng: crate.longitude,
      });
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCrate = crate;
      }
    }
    return closestCrate;
  }

  async assignQRCode(crateId: number, qrCodeId: number): Promise<Crate> {
    await this.prisma.qRCode.update({
      where: { id: qrCodeId },
      data: {
        crateId: crateId,
        crate: { connect: { id: crateId } },
      },
      include: { crate: true },
    });
    const crate = await this.prisma.crate.findUnique({
      where: { id: crateId },
    });
    return Crate.create(crate);
  }
}
