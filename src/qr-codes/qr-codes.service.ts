import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { QRCode } from './entities/qr-code.entity';
import { QRCodesError } from './qr-codes.error';
import { QRScanEvent } from './entities/qr-scan-event.entity';
import { GeographicCoordinate } from '../common/utils/geolocalisation.util';
import { shuffleArray } from '../common/utils/shuffle.util';

@Injectable()
export class QRCodesService {
  constructor(readonly prisma: PrismaService) {}

  async findUniqueByHash(hash: string): Promise<QRCode> {
    try {
      const qrCode = await this.prisma.qRCode.findUniqueOrThrow({
        where: {
          hash,
        },
      });
      return QRCode.create(qrCode);
    } catch (error) {
      throw new QRCodesError(QRCodesError.NOT_FOUND, 'QR Code hash not found');
    }
  }

  async findOneById(id: number): Promise<QRCode> {
    try {
      const qrCode = await this.prisma.qRCode.findUniqueOrThrow({
        where: { id },
      });
      return QRCode.create(qrCode);
    } catch (error) {
      throw new QRCodesError(QRCodesError.NOT_FOUND, 'QR-Code hash not found');
    }
  }

  async getOneById(id: number): Promise<QRCode | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  async getAllShuffled(): Promise<QRCode[]> {
    const qrCodes = await this.prisma.qRCode.findMany({
      orderBy: { id: 'asc' },
    });
    const usableQrCodes = qrCodes.slice(100, -200);
    const shuffled = shuffleArray(usableQrCodes);
    return shuffled.map(QRCode.create);
  }

  async registerScanEvent(
    qrCodeId: number,
    coordinate: GeographicCoordinate,
  ): Promise<QRScanEvent> {
    const qrScanEvent = await this.prisma.qRScanEvent.create({
      data: {
        latitude: coordinate.lat,
        longitude: coordinate.lng,
        qrCode: { connect: { id: qrCodeId } },
      },
      include: { qrCode: true },
    });
    return QRScanEvent.create(qrScanEvent);
  }

  async getAllQRScanEvents(): Promise<QRScanEvent[]> {
    const qrScanEvents = await this.prisma.qRScanEvent.findMany({
      include: { qrCode: true },
    });
    return qrScanEvents.map(QRScanEvent.create);
  }
}
