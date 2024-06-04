import { Injectable } from '@nestjs/common';
import { Magic, MagicUserMetadata } from '@magic-sdk/admin';
import { ConfigService } from '@nestjs/config';
import { AuthError } from './auth.errors';

@Injectable()
export class MagicService {
  private magic: Magic;

  constructor(private readonly configService: ConfigService) {
    this.magic = new Magic(this.configService.get('MAGIC_SECRET_KEY'));
  }

  async validateDidToken(token: string): Promise<MagicUserMetadata> {
    try {
      this.magic.token.validate(token);
      return await this.magic.users.getMetadataByToken(token);
    } catch (error) {
      throw new AuthError(
        AuthError.WRONG_CREDENTIALS,
        'Token (DID) validation failed.',
      );
    }
  }
}
