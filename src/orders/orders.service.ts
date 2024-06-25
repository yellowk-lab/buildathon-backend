import { Injectable } from '@nestjs/common';
import { Order } from './entities/order.entity';
import { PrismaService } from '../prisma/prisma.service';
import { RedeemLootInput } from './dto/redeem-loot.input';
import { LootBoxesService } from '../loot-boxes/loot-boxes.service';
import { UsersService } from '../users/users.service';
import { OrdersError } from './orders.error';
import { Web3Service } from '../web3/web3.service';
import { DeliveryAddress } from './entities/delivery-address.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    readonly prisma: PrismaService,
    private lootBoxesService: LootBoxesService,
    private usersService: UsersService,
    private web3Service: Web3Service,
    private emailService: MailService,
  ) {}
  async processLootRedemption(input: RedeemLootInput): Promise<Order> {
    const {
      lootNftId,
      transactionHash,
      email,
      walletAddress,
      firstName,
      lastName,
      deliveryAddress,
    } = input;
    const txHashAlreadyUsed =
      await this.isTransactionHashAlreadyClaimed(transactionHash);
    if (txHashAlreadyUsed) {
      throw new OrdersError(
        OrdersError.TRANSACTION_HASH_ALREADY_EXIST,
        'The loot related to this transaction hash has already been claimed',
      );
    }
    const lootBox = await this.lootBoxesService.findOneByNftId(lootNftId);
    const owner = await this.usersService.findOneByWalletAddress(walletAddress);
    const hasTokenBeenCorrectlyTransfered =
      await this.web3Service.tokenIdWasTransferedToContract(
        transactionHash,
        walletAddress,
        BigInt(lootNftId),
      );
    if (lootBox.claimedById !== owner.id) {
      throw new OrdersError(
        OrdersError.TOKEN_OWNER_DIFFERENT_FROM_WALLET,
        'The wallet address is not the same as the one that claimed it',
      );
    }
    if (!hasTokenBeenCorrectlyTransfered) {
      throw new OrdersError(
        OrdersError.TOKEN_TRANSFER_NOT_VALID,
        'The transaction hash verification failed',
      );
    }

    if (!owner.email) {
      await this.usersService.updateEmail(owner.id, email);
    }

    const orderPrisma = await this.prisma.order.create({
      data: {
        lootId: lootBox.lootId,
        userId: owner.id,
        transactionHash,
        firstName,
        lastName,
        deliveryAddress: deliveryAddress
          ? {
              create: { ...deliveryAddress },
            }
          : undefined,
      },
    });
    const order = Order.create(orderPrisma);

    return order;
  }

  async isTransactionHashAlreadyClaimed(
    transactionHash: string,
  ): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { transactionHash },
    });
    return !!order;
  }

  async findDeliveryAddressByOrderId(
    orderId: string,
  ): Promise<DeliveryAddress> {
    try {
      const deliveryAddress =
        await this.prisma.deliveryAddress.findUniqueOrThrow({
          where: { orderId },
        });
      return DeliveryAddress.create(deliveryAddress);
    } catch (err) {
      throw new OrdersError(
        OrdersError.DELIVERY_ADDRESS_NOT_FOUND,
        'Delivery address not found',
      );
    }
  }

  async getDeliveryAddressByOrderId(
    id: string,
  ): Promise<DeliveryAddress | null> {
    try {
      return await this.findDeliveryAddressByOrderId(id);
    } catch (err) {
      return null;
    }
  }
}
