import { LootBox } from '../../loot-boxes/entities/loot-box.entity';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { QRScanEvent } from './qr-scan-event.entity';
import { Crate } from '../../crates/entities/crate.entity';
import {
  QRCode as QRCodePrisma,
  LootBox as LootBoxPrisma,
  QRScanEvent as QRScanEventPrisma,
  Crate as CratePrisma,
} from '@prisma/client';

@ObjectType()
export class QRCode {
  @Field(() => Int)
  id: number;

  @Field(() => Int, { nullable: true })
  crateId?: number;

  @Field(() => Crate, { nullable: true })
  crate?: Crate;

  @Field(() => [LootBox], { nullable: true })
  lootBoxes?: LootBox[];

  @Field(() => [QRScanEvent], { nullable: true })
  scanHistory?: QRScanEvent[];

  constructor(id: number) {
    this.id = id;
  }

  static create(
    qrCodeDB: QRCodePrisma & {
      crate?: CratePrisma;
      lootBoxes?: LootBoxPrisma[];
      scanHistory?: QRScanEventPrisma[];
    },
  ): QRCode {
    const qrCode = new QRCode(qrCodeDB.id);
    qrCode.crateId = qrCodeDB.crateId;
    const { lootBoxes, scanHistory, crate } = qrCodeDB;
    if (crate) {
      qrCode.crate = Crate.create(crate);
    }
    if (lootBoxes) {
      qrCode.lootBoxes = lootBoxes.map(LootBox.create);
    }
    if (scanHistory) {
      qrCode.scanHistory = scanHistory.map(QRScanEvent.create);
    }

    return qrCode;
  }
}

@ObjectType()
export class QRCodeWithHash extends QRCode {
  @Field(() => String)
  hash: string;

  constructor(id: number, hash: string) {
    super(id);
    this.hash = hash;
  }
  static create(qrCodeDB: QRCodePrisma): QRCodeWithHash {
    const qrCode = new QRCodeWithHash(qrCodeDB.id, qrCodeDB.hash);
    qrCode.crateId = qrCodeDB.crateId;
    return qrCode;
  }
}
