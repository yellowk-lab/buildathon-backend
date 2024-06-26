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
import { DeliveryAddress } from './entities/delivery-address.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LootBox } from '../loot-boxes/entities/loot-box.entity';
import { LootBoxesService } from '../loot-boxes/loot-boxes.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private ordersService: OrdersService,
    private lootBoxesService: LootBoxesService,
    private usersService: UsersService,
  ) {}

  @Mutation(() => Order, { name: 'redeemLoot' })
  async collectLootAndNotify(@Args('input') input: RedeemLootInput) {
    return await this.ordersService.processLootRedemption(input);
  }

  @ResolveField(() => LootBox, { name: 'lootBox' })
  async getLootBox(@Parent() order: Order) {
    const { lootBoxId } = order;
    return await this.lootBoxesService.getOneById(lootBoxId);
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
