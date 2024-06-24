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

  async findOneById(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
      return User.create(user);
    } catch (error) {
      throw new UsersError(UsersError.NOT_FOUND, 'User not found');
    }
  }

  async getOneById(id: string): Promise<User | null> {
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

  async createUser(email: string, walletAddress: string): Promise<User> {
    const user = await this.prisma.user.create({
      data: { email, walletAddress },
    });
    return User.create(user);
  }
}
