import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Order as OrderPrisma } from '@prisma/client';
import { OrderStatus } from '../orders.enum';
import { DeliveryAddress } from './delivery-address.entity';
import { User } from '../../users/entities/user.entity';
import { LootBox } from '../../loot-boxes/entities/loot-box.entity';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  trackingNumber: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => String)
  transactionHash: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  lootBoxId: string;

  @Field(() => LootBox)
  lootBox: LootBox;

  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => DeliveryAddress, { nullable: true })
  deliveryAddress?: DeliveryAddress;

  constructor(
    id: string,
    trackingNumber: number,
    status: OrderStatus,
    transactionHash: string,
    firstName: string,
    lastName: string,
    lootBoxId: string,
    userId: string,
  ) {
    this.id = id;
    this.trackingNumber = trackingNumber;
    this.status = status;
    this.transactionHash = transactionHash;
    this.firstName = firstName;
    this.lastName = lastName;
    this.lootBoxId = lootBoxId;
    this.userId = userId;
  }

  static create(order: OrderPrisma): Order {
    return new Order(
      order.id,
      order.trackingNumber,
      OrderStatus[order.status],
      order.transactionHash,
      order.firstName,
      order.lastName,
      order.lootBoxId,
      order.userId,
    );
  }
}
