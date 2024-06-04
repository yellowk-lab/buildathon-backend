import { Injectable } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/users.entity';
import { MomentService } from '../core/moment/moment.service';
import { ProductError, ProductFieldError } from './products.errors';
import { Product, Prisma, TransactionType, Sale } from '@prisma/client';
import { Moment } from 'moment-timezone';
import { secureNameGenerator } from '../common/utils/string.util';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { FileUploadPayload } from './dto/file-upload-payload.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FeesService } from '../fees/fees.service';
import { ProductPrices } from './dto/product-prices.dto';
import { ConfigService } from '@nestjs/config';
import { CurrencyConverterService } from '../payment/currency-converter/currency-converter.service';
import { getParamByISO } from 'iso-country-currency';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly paymentService: PaymentService,
    private readonly transactionsService: TransactionsService,
    private readonly feesService: FeesService,
    private readonly momentService: MomentService,
    private readonly configService: ConfigService,
    private readonly currencyConverterService: CurrencyConverterService,
  ) {}

  async findById(id: string): Promise<Product> {
    try {
      return await this.prisma.product.findUniqueOrThrow({
        where: { id },
        include: { sales: true },
      });
    } catch (error) {
      throw new ProductError(
        ProductError.NOT_FOUND,
        `Product with id ${id} not found`,
      );
    }
  }

  async findByHash(hash: string): Promise<Product> {
    try {
      return await this.prisma.product.findUniqueOrThrow({
        where: { fileStorageHash: hash },
        include: { sales: true },
      });
    } catch (error) {
      throw new ProductError(ProductError.NOT_FOUND, 'Product not found');
    }
  }

  async getOneByFileHash(hash: string): Promise<Product | null> {
    try {
      return await this.findByHash(hash);
    } catch (error) {
      return null;
    }
  }

  async create(
    createProductInput: CreateProductInput,
    creator: User,
  ): Promise<Product> {
    const { fileStorageHash, price, name, currency, expiresAt } =
      createProductInput;
    const minimumPrice = this.configService.get<number>(
      'PRODUCT_MINIMUM_PRICE',
    );
    if (price < minimumPrice) {
      throw new ProductFieldError(
        ProductFieldError.MINIMUM_PRICE_LIMIT,
        `The minimal price is ${minimumPrice}`,
        { price: 'Value to low' },
      );
    }
    await this.usersService.findOneById(creator.id);

    const fileHashExists = await this.getOneByFileHash(fileStorageHash);
    if (fileHashExists) {
      throw new ProductFieldError(
        ProductFieldError.FILE_HASH_NOT_UNIQUE,
        'The hash must be unique',
        { fileStorageHash: 'Already exists' },
      );
    }
    const moment = this.momentService.get();
    const productName = name ? name : moment().format('MMM DD');
    const stripeProductId = await this.paymentService.createStripeProduct(
      price,
      productName,
      currency,
      { creatorId: creator.id },
    );
    let expiredDate: Moment;
    if (expiresAt) {
      if (!moment(expiresAt).isValid()) {
        throw new ProductFieldError(
          ProductFieldError.DATE_CODES_ERRORS.INVALID_FORMAT,
          'The field is not in a validate format',
          { expiresAt: 'Invalide date' },
        );
      } else {
        expiredDate = moment(expiresAt);
        if (expiredDate.isSameOrBefore(moment())) {
          throw new ProductFieldError(
            ProductFieldError.DATE_CODES_ERRORS.INVALIDE_DATE_RANGE,
            'Create product: Cannot have expire date prior to today',
            { expiresAt: 'Date must be later' },
          );
        }
      }
    }
    return await this.prisma.product.create({
      data: {
        fileStorageHash,
        name: productName,
        price,
        currency,
        stripeProductId,
        creatorId: creator.id,
        expiredAt: expiresAt ? moment(expiresAt).toDate() : expiresAt,
      },
    });
  }

  async generateUniqueName(): Promise<string> {
    let isHashUnique = false;
    let generatedName: string = secureNameGenerator();
    while (!isHashUnique) {
      const product = await this.prisma.product.findUnique({
        where: { fileStorageHash: generatedName },
      });
      if (!product) {
        isHashUnique = true;
      } else {
        generatedName = secureNameGenerator();
      }
    }
    return generatedName;
  }

  async getUploadUrl(): Promise<FileUploadPayload> {
    const fileStorageHash = await this.generateUniqueName();
    const url =
      await this.digitalOceanService.generatePreSignedFileUploadUrl(
        fileStorageHash,
      );
    return FileUploadPayload.create(url, fileStorageHash);
  }

  async getDownloadUrl(
    productId: string,
    paymentIntentId: string,
  ): Promise<string> {
    const product = await this.findById(productId);
    await this.paymentService.verifyProductPayment(
      product.stripeProductId,
      paymentIntentId,
    );

    return await this.digitalOceanService.generatePreSignedFileDownloadUrl(
      product.fileStorageHash,
    );
  }

  async findProductByStripeId(stripeProductId: string): Promise<Product> {
    return await this.prisma.product.findUnique({
      where: {
        stripeProductId,
      },
    });
  }

  async buy(productId: string): Promise<string> {
    const product = await this.findById(productId);
    return await this.paymentService.createPaymentIntent(
      product.stripeProductId,
    );
  }

  async findAll(filter?: {
    take?: number;
    skip?: number;
    creatorIds?: string[];
  }): Promise<Product[]> {
    return await this.prisma.product.findMany({
      take: filter?.take,
      skip: filter?.skip,
      where: {
        creatorId: { in: filter?.creatorIds },
      },
      include: { sales: true },
    });
  }

  async findUnique(
    productWhereUniqueInput: Prisma.ProductWhereUniqueInput,
    includeOptions?: Prisma.ProductInclude,
  ): Promise<Product> {
    return await this.prisma.product.findUnique({
      where: productWhereUniqueInput,
      include: includeOptions,
    });
  }

  async calculateCreatorEarnings(productId: string): Promise<number> {
    const product = await this.findById(productId);
    const txs = await this.transactionsService.findAll({
      transactionWhereInput: {
        sale: {
          productId: product.id,
          product: { creatorId: product.creatorId },
        },
        type: TransactionType.CreatorEarnings,
        recipientId: product.creatorId,
      },
    });
    let earnings = this.transactionsService.calculateTotalAmount(txs);

    const currency = product.currency.toUpperCase();
    if (currency !== CurrencyConverterService.DEFAULT_CURRENCY) {
      const rates = await this.currencyConverterService.getRates([
        CurrencyConverterService.DEFAULT_CURRENCY,
        currency,
      ]);
      earnings = this.currencyConverterService.convertCHFToOtherCurrency(
        earnings,
        currency,
        rates,
      );
    }
    return earnings;
  }

  async getTotaleSalesNumber(productId: string): Promise<number> {
    const productWithSales: Product & { sales: Sale[] } =
      await this.prisma.product.findUnique({
        where: { id: productId },
        include: { sales: true },
      });
    return productWithSales.sales ? productWithSales.sales.length : 0;
  }

  async increaseClickCount(productId: string): Promise<boolean> {
    try {
      await this.prisma.product.update({
        where: { id: productId },
        data: { clickCount: { increment: 1 } },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async calculatePrices(base: number): Promise<ProductPrices> {
    let platformFees = await this.feesService.getDefaultPlatformFees();
    platformFees = platformFees / 100;
    const finalPrice = Math.round(
      (base * (1 - platformFees / 2)) / (1 - platformFees),
    );
    const creatorPrice = Math.round(finalPrice * (1 - platformFees));
    return { finalPrice, creatorPrice };
  }
}
