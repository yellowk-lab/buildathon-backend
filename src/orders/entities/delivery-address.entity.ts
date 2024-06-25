import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DeliveryAddress as DeliveryAddressPrisma } from '@prisma/client';
import { Order } from './order.entity';

@ObjectType()
export class DeliveryAddress {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  street: string;

  @Field(() => String)
  city: string;

  @Field(() => String)
  zipCode: string;

  @Field(() => String)
  country: string;

  orderId: string;

  @Field(() => Order)
  order: Order;

  static create(deliveryAddr: DeliveryAddressPrisma): DeliveryAddress {
    const delivery = new DeliveryAddress();
    delivery.id = deliveryAddr.id;
    delivery.street = deliveryAddr.street;
    delivery.city = deliveryAddr.city;
    delivery.country = deliveryAddr.country;
    delivery.orderId = deliveryAddr.orderId;
    return delivery;
  }
}
