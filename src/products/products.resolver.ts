import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Directive,
  Int,
} from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { UsePipes, UseGuards, ValidationPipe } from '@nestjs/common';
import { FileUploadPayload } from './dto/file-upload-payload.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationArgs } from '../common/args/pagination.args';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { MomentService } from '../core/moment/moment.service';
import { ProductPrices } from './dto/product-prices.dto';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly momentService: MomentService,
  ) {}

  @UseGuards(JwtAccessGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Mutation(() => Product)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @CurrentUser() creator: User,
  ) {
    const productPrisma = await this.productsService.create(input, creator);
    return Product.create(productPrisma, this.momentService);
  }

  @Mutation(() => String)
  async buyProduct(@Args('productId') productId: string) {
    return await this.productsService.buy(productId);
  }

  @UseGuards(JwtAccessGuard)
  @Query(() => FileUploadPayload, { name: 'productUploadUrl' })
  async getProductUploadUrl() {
    return await this.productsService.getUploadUrl();
  }

  @Query(() => String, { name: 'productDownloadUrl' })
  async getProductDownloadUrl(
    @Args('productId') productId: string,
    @Args('paymentIntentId') paymentIntentId: string,
  ) {
    return await this.productsService.getDownloadUrl(
      productId,
      paymentIntentId,
    );
  }

  @Query(() => Product, { name: 'product' })
  async findOne(@Args('id', { type: () => ID }) id: string) {
    const product = await this.productsService.findById(id);
    return Product.create(product, this.momentService);
  }

  @UseGuards(JwtAccessGuard)
  @Query(() => [Product], { name: 'products' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCreatorProducts(
    @Args() args: PaginationArgs,
    @CurrentUser() creator: User,
  ) {
    const productsPrisma = await this.productsService.findAll({
      creatorIds: [creator.id],
      ...args,
    });

    return productsPrisma.map((product) => {
      return Product.create(product, this.momentService);
    });
  }

  @Mutation(() => Boolean)
  async increaseClick(@Args('productId') productId: string) {
    return await this.productsService.increaseClickCount(productId);
  }

  @UseGuards(JwtAccessGuard)
  @Query(() => ProductPrices)
  async calculateFinalPrice(
    @Args('price', { type: () => Int })
    price: number,
  ) {
    return await this.productsService.calculatePrices(price);
  }

  @Directive('@auth')
  @ResolveField('creator', () => User)
  async getCreator(@Parent() product: Product) {
    const { creatorId } = product;
    return this.usersService.getOneById(creatorId);
  }

  @Directive('@auth')
  @ResolveField('earnings', () => Int)
  async getTotalEarnings(@Parent() product: Product) {
    const { id } = product;
    return await this.productsService.calculateCreatorEarnings(id);
  }

  @Directive('@auth')
  @ResolveField('salesCount', () => Int)
  async getTotalSales(@Parent() product: Product) {
    const { id } = product;
    return await this.productsService.getTotaleSalesNumber(id);
  }
}
