import { Injectable } from '@nestjs/common';
import { Location } from './entities/location.entity';
import { PrismaService } from '../prisma/prisma.service';
import { LocationsError } from './locations.error';

@Injectable()
export class LocationsService {
  constructor(readonly prisma: PrismaService) {}

  async findOneById(id: string): Promise<Location> {
    try {
      const location = await this.prisma.location.findUniqueOrThrow({
        where: { id },
      });
      return Location.create(location);
    } catch (error) {
      throw new LocationsError(LocationsError.NOT_FOUND, 'Location not found');
    }
  }

  async getOneById(id: string): Promise<Location | null> {
    try {
      return !id ? null : await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }
}
