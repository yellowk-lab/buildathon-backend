import { LootBox } from '../../loot-boxes/entities/loot-box.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User as UserPrisma } from '@prisma/client';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  walletAddress: string;

  @Field(() => [LootBox], { nullable: true })
  claimedLootBoxes?: LootBox[];

  static create(userDb: UserPrisma) {
    const user = new User();
    user.id = userDb.id;
    user.email = userDb.email;
    return user;
  }
}
