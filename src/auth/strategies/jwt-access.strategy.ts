import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    protected readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const data = req?.signedCookies['auth-cookie'];
          if (!data) {
            return null;
          }
          return data.accessToken;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }
  async validate(payload: JwtPayload) {
    const user = await this.userService.getOneById(payload.sub);
    if (user) {
      return user;
    }
    return false;
  }
}
