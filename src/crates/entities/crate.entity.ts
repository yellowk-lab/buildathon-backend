import { QRCode } from '../../qr-codes/entities/qr-code.entity';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Crate as CratePrisma } from '@prisma/client';

@ObjectType()
export class Crate {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  address: string;

  @Field(() => String)
  positionName: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Int, { nullable: true })
  qrCodeId?: number;

  @Field(() => QRCode, { nullable: true })
  qrCode?: QRCode;

  static create(crateDB: CratePrisma): Crate {
    const crate = new Crate();
    crate.id = crateDB.id;
    crate.address = crateDB.address;
    crate.positionName = crateDB.positionName;
    crate.latitude = crateDB.latitude;
    crate.longitude = crateDB.longitude;
    crate.qrCodeId = crateDB.qrCodeId;

    return crate;
  }
}
