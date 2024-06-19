import { Field, ObjectType, Int, ID } from '@nestjs/graphql';
import { Loot as LootPrisma } from '@prisma/client';
import { LootBox } from './loot-box.entity';

@ObjectType()
export class Loot {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  displayName: string;

  @Field(() => Int)
  totalSupply: number;

  @Field(() => Int)
  circulatingSupply: number;

  @Field(() => Int)
  claimedSupply?: number;

  @Field(() => [LootBox], { nullable: true })
  lootBoxes?: LootBox[];

  constructor(
    id: string,
    name: string,
    displayName: string,
    totalSupply: number,
    circulatingSupply: number,
  ) {
    this.id = id;
    this.name = name;
    this.displayName = displayName;
    this.totalSupply = totalSupply;
    this.circulatingSupply = circulatingSupply;
  }

  static create(loot: LootPrisma) {
    const newLoot = new Loot(
      loot.id,
      loot.name,
      loot.displayName,
      loot.totalSupply,
      loot.circulatingSupply,
    );
    return newLoot;
  }
}
