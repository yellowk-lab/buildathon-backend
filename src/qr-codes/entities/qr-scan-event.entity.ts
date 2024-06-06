import {
  ObjectType,
  Field,
  Int,
  Float,
  GraphQLTimestamp,
} from '@nestjs/graphql';
import { QRCode } from './qr-code.entity';
import {
  QRScanEvent as QRScanEventPrisma,
  QRCode as QRCodePrisma,
} from '@prisma/client';

@ObjectType()
export class QRScanEvent {
  @Field(() => Int)
  id: number;

  @Field(() => GraphQLTimestamp)
  date: Date;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field(() => Int)
  qrCodeId: number;

  @Field(() => QRCode)
  qrCode: QRCode;

  static create(
    qrScanEventDB: QRScanEventPrisma & { qrCode: QRCodePrisma },
  ): QRScanEvent {
    const scanEvent = new QRScanEvent();
    scanEvent.id = qrScanEventDB.id;
    scanEvent.date = qrScanEventDB.date;
    scanEvent.latitude = qrScanEventDB.latitude;
    scanEvent.longitude = qrScanEventDB.longitude;
    scanEvent.qrCodeId = qrScanEventDB.qrCodeId;
    const { qrCode } = qrScanEventDB;
    scanEvent.qrCode = QRCode.create(qrCode);

    return scanEvent;
  }
}
