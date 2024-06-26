import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Order as OrderPrisma } from '@prisma/client';
import { OrderStatus } from '../orders.enum';
import { Loot } from '../../loot-boxes/entities/loot.entity';
import { DeliveryAddress } from './delivery-address.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Order {
  @Field(() => Int)
  id: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => String)
  transactionHash: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  lootId: string;

  @Field(() => Loot)
  loot: Loot;

  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => DeliveryAddress, { nullable: true })
  deliveryAddress?: DeliveryAddress;

  constructor(
    id: number,
    status: OrderStatus,
    transactionHash: string,
    firstName: string,
    lastName: string,
    lootId: string,
    userId: string,
  ) {
    this.id = id;
    this.status = status;
    this.transactionHash = transactionHash;
    this.firstName = firstName;
    this.lastName = lastName;
    this.lootId = lootId;
    this.userId = userId;
  }

  static create(order: OrderPrisma): Order {
    return new Order(
      order.id,
      OrderStatus[order.status],
      order.transactionHash,
      order.firstName,
      order.lastName,
      order.lootId,
      order.userId,
    );
  }
}
