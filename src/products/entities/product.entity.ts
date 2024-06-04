import {
  ObjectType,
  Field,
  Int,
  ID,
  GraphQLTimestamp,
  Directive,
} from '@nestjs/graphql';
import { Product as ProductPrisma } from '@prisma/client';
import { MomentService } from '../../core/moment/moment.service';
import { User } from '../../users/entities/users.entity';

@ObjectType()
export class Product {
  @Field(() => ID, { description: 'unique identifier' })
  id: string;

  fileStorageHash: string;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  price: number;

  @Field(() => String)
  currency: string;

  @Field(() => String)
  stripeProductId: string;

  @Directive('@auth')
  @Field(() => Int)
  clickCount: number;

  @Directive('@auth')
  @Field(() => Int)
  salesCount: number;

  @Directive('@auth')
  @Field(() => Int)
  earnings: number;

  @Directive('@auth')
  @Field(() => User, { nullable: true })
  creator?: User;

  @Directive('@auth')
  @Field(() => ID)
  creatorId: string;

  @Directive('@auth')
  @Field(() => GraphQLTimestamp, { nullable: true })
  expiredAt?: Date;

  @Directive('@auth')
  @Field(() => GraphQLTimestamp)
  createdAt: Date;

  static create(
    productPrisma: ProductPrisma,
    momentService?: MomentService,
  ): Product {
    const product = new Product();
    const moment = momentService?.get();
    product.id = productPrisma.id;
    product.fileStorageHash = productPrisma.fileStorageHash;
    product.name = productPrisma.name;
    product.price = productPrisma.price;
    product.currency = productPrisma.currency;
    product.stripeProductId = productPrisma.stripeProductId;
    product.clickCount = productPrisma.clickCount;
    product.creatorId = productPrisma.creatorId;
    product.expiredAt = productPrisma.expiredAt
      ? moment(productPrisma.expiredAt).toDate()
      : null;
    product.createdAt = moment(productPrisma.createdAt).toDate();

    return product;
  }
}
