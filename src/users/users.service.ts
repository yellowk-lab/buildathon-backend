import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersError } from './users.error';

@Injectable()
export class UsersService {
  constructor(readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { email },
      });
      return User.create(user);
    } catch (error) {
      throw new UsersError(UsersError.NOT_FOUND, 'User not found');
    }
  }

  async findOneById(id: number): Promise<User> {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
      return User.create(user);
    } catch (error) {
      throw new UsersError(UsersError.NOT_FOUND, 'User not found');
    }
  }

  async getOneById(id: number): Promise<User | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }
  async getOneByEmail(email: string): Promise<User | null> {
    try {
      return await this.findByEmail(email);
    } catch (error) {
      return null;
    }
  }

  async createUser(
    email: string,
    drawPrizeRegistered?: boolean,
  ): Promise<User> {
    const user = await this.prisma.user.create({
      data: { email, drawPrizeRegistered },
    });
    return User.create(user);
  }

  async updateDrawPrizeRegsitered(
    userId: number,
    drawPrizeRegistered: boolean,
  ): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { drawPrizeRegistered },
    });
    return User.create(updatedUser);
  }
}
