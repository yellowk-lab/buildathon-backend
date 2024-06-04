import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MagicService } from './magic.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import RegisterInput from './dto/register.input';

@Injectable()
export class AuthService {
  static ACCESS_TOKEN_EXPIRE = '24h';
  static REFRESH_TOKEN_EXPIRE = '7d';
  static AUTH_COOKIE_NAME = 'auth-cookie';

  constructor(
    private readonly usersService: UsersService,
    private readonly magicService: MagicService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async register(token: string, input: RegisterInput) {
    await this.magicService.validateDidToken(token);
    const user =
      await this.usersService.registerWithVerificationAndReferral(input);
    const authTokens = await this.getTokens(user.id, user.email);
    return { user, authTokens };
  }

  async signIn(token: string) {
    const { email } = await this.magicService.validateDidToken(token);
    const user = await this.usersService.findByEmail(email);
    const authTokens = await this.getTokens(user.id, user.email);
    return { user, authTokens };
  }

  async getTokens(ID: string, email: string) {
    const jwtPayload = {
      sub: ID,
      email,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: AuthService.ACCESS_TOKEN_EXPIRE,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: AuthService.REFRESH_TOKEN_EXPIRE,
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async isUserAlreadyRegistered(email: string) {
    try {
      await this.usersService.findByEmail(email);
      return true;
    } catch (error) {
      return false;
    }
  }
}
