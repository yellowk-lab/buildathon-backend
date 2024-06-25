import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { RedeemLootInput } from './dto/redeem-loot.input';
import { Loot } from '../loot-boxes/entities/loot.entity';
import { LootsService } from '../loot-boxes/loots/loots.service';
import { DeliveryAddress } from './entities/delivery-address.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private ordersService: OrdersService,
    private lootsService: LootsService,
    private usersService: UsersService,
  ) {}

  @Mutation(() => Order, { name: 'redeemLoot' })
  async collectLootAndNotify(@Args('input') input: RedeemLootInput) {
    return await this.ordersService.processLootRedemption(input);
  }

  @ResolveField(() => Loot, { name: 'loot' })
  async getLoot(@Parent() order: Order) {
    const { lootId } = order;
    return await this.lootsService.getOneById(lootId);
  }

  @ResolveField(() => DeliveryAddress, {
    nullable: true,
    name: 'deliveryAddress',
  })
  async getDeliveryAddress(@Parent() order: Order) {
    const { id } = order;
    return await this.ordersService.getDeliveryAddressByOrderId(id);
  }

  @ResolveField(() => User, { name: 'user' })
  async getUser(@Parent() order: Order) {
    const { userId } = order;
    return await this.usersService.getOneById(userId);
  }
}
