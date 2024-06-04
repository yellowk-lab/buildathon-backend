import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from './digital-ocean.config';
import { secureNameGenerator } from '../common/utils/string.util';
import { DigitalOceanError } from './digital-ocean.errors';

@Injectable()
export class DigitalOceanService {
  private s3Client: S3;
  private BUCKET_NAME = this.configService.get<string>('SPACES_BUCKET_NAME');

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3({
      forcePathStyle: false,
      endpoint: this.configService.get<string>('SPACES_ENDPOINT'),
      region: config.region,
      credentials: {
        accessKeyId: this.configService.get<string>('SPACES_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('SPACES_ACCESS_SECRET'),
      },
    });
  }

  async generatePreSignedFileUploadUrl(
    fileName?: string,
    userFilePath?: string,
  ): Promise<string> {
    try {
      const fileKey = fileName ? fileName : secureNameGenerator();
      const params = {
        Bucket: this.BUCKET_NAME,
        Key: userFilePath ? userFilePath.concat('/', fileKey) : fileKey,
      };

      return await getSignedUrl(this.s3Client, new PutObjectCommand(params), {
        expiresIn: config.uploadExpiresIn,
      });
    } catch (error) {
      throw new DigitalOceanError(
        DigitalOceanError.SERVER_CODES.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  async generatePreSignedFileDownloadUrl(filePath: string): Promise<string> {
    try {
      const params = { Bucket: this.BUCKET_NAME, Key: filePath };

      return await getSignedUrl(this.s3Client, new GetObjectCommand(params), {
        expiresIn: config.downloadExpiresIn,
      });
    } catch (error) {
      throw new DigitalOceanError(
        DigitalOceanError.SERVER_CODES.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  async getAllFilesInBucket() {
    try {
      const params = {
        Bucket: this.BUCKET_NAME,
      };
      const data = await this.s3Client.send(new ListObjectsCommand(params));
      return data.Contents;
    } catch (error) {
      throw new DigitalOceanError(
        DigitalOceanError.SERVER_CODES.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  async deleteFile(filePath: string) {
    try {
      const params = {
        Bucket: this.BUCKET_NAME,
        Key: filePath,
      };
      const data = await this.s3Client.send(new DeleteObjectCommand(params));
      return data;
    } catch (error) {
      throw new DigitalOceanError(
        DigitalOceanError.SERVER_CODES.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }
}
