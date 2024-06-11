import { LootBox } from '../../loot-boxes/entities/loot-box.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User as UserPrisma } from '@prisma/client';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  email: string;

  @Field(() => Boolean)
  drawPrizeRegistered: boolean;

  @Field(() => [LootBox], { nullable: true })
  openedLootBoxes?: LootBox[];

  static create(userDb: UserPrisma) {
    const user = new User();
    user.id = userDb.id;
    user.email = userDb.email;
    user.drawPrizeRegistered = userDb.drawPrizeRegistered;
    return user;
  }
}
