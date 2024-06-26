import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersError, UsersFieldError } from './users.error';

@Injectable()
export class UsersService {
  constructor(readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.prisma.user.findFirstOrThrow({
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
    const emailExists = await this.emailAlreadyUsed(email);
    if (emailExists) {
      throw new UsersFieldError(
        UsersFieldError.EMAIL_CODES.ALREADY_EXIST,
        'The email address is not unique and already exist',
        { email: 'Alread used' },
      );
    }
    const user = await this.prisma.user.create({
      data: { email, walletAddress },
    });
    return User.create(user);
  }

  async findOneByWalletAddress(walletAddress: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { walletAddress },
      });
      return User.create(user);
    } catch (err) {
      throw new UsersError(
        UsersError.NOT_FOUND,
        'No user found with this wallet address',
      );
    }
  }

  async getOneByWalletAddress(walletAddress: string): Promise<User | null> {
    try {
      return await this.findOneByWalletAddress(walletAddress);
    } catch (err) {
      return null;
    }
  }

  async emailAlreadyUsed(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });
    return !!user;
  }

  async updateEmail(id: string, email: string): Promise<User> {
    const emailExists = await this.emailAlreadyUsed(email);
    if (emailExists) {
      throw new UsersFieldError(
        UsersFieldError.EMAIL_CODES.ALREADY_EXIST,
        'The email address is not unique and already exist',
        { email: 'Alread used' },
      );
    }
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { email },
    });
    return User.create(updatedUser);
  }
}
