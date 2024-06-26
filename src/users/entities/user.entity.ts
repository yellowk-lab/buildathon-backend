import { LootBox } from '../../loot-boxes/entities/loot-box.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User as UserPrisma } from '@prisma/client';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  walletAddress: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => [LootBox], { nullable: true })
  claimedLootBoxes?: LootBox[];

  constructor(id: string, walletAddress: string, email?: string) {
    this.id = id;
    this.walletAddress = walletAddress;
    this.email = email;
  }

  static create(user: UserPrisma): User {
    return new User(user.id, user.walletAddress, user.email);
  }
}
