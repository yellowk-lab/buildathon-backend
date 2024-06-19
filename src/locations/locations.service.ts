import { Injectable } from '@nestjs/common';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { Location } from './entities/location.entity';
import { PrismaService } from '../prisma/prisma.service';
import { LocationsError } from './locations.error';

@Injectable()
export class LocationsService {
  constructor(readonly prisma: PrismaService) {}

  create(createLocationInput: CreateLocationInput) {
    return 'This action adds a new location';
  }

  findAll() {
    return `This action returns all locations`;
  }

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
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  update(id: number, updateLocationInput: UpdateLocationInput) {
    return `This action updates a #${id} location`;
  }

  remove(id: number) {
    return `This action removes a #${id} location`;
  }
}
