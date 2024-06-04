import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { AuthError } from '../auth.errors';
import { ExtractJwt } from 'passport-jwt';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { User } from '@prisma/client';

type AuthToken = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super();
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(ctx);
    const { req, res } = gqlContext.getContext();

    const tokens = this.extractTokensFromRequest(req);

    const { accessToken, refreshToken } = tokens || {};
    let user = await this.getUserFromToken(accessToken, 'JWT_ACCESS_SECRET');

    if (!user) {
      user = await this.getUserFromToken(refreshToken, 'JWT_REFRESH_SECRET');
      if (!user) {
        res.clearCookie(AuthService.AUTH_COOKIE_NAME);
        throw new AuthError(
          AuthError.UNAUTHORIZED,
          'Access token: Invalid JWT',
        );
      }
      const { email, sub } = this.jwtService.decode(refreshToken);
      const newTokens = await this.authService.getTokens(sub, email);
      this.setTokensInRequestAndResponse(req, res, user, newTokens);
    } else {
      req.user = user;
    }
    return true;
  }

  private extractTokensFromRequest(request: Request): AuthToken | null {
    return ExtractJwt.fromExtractors([
      (req: Request) =>
        req?.signedCookies[AuthService.AUTH_COOKIE_NAME] || null,
    ])(request) as unknown as AuthToken;
  }

  private async getUserFromToken(
    token: string,
    secretName: string,
  ): Promise<User | null> {
    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get(secretName),
      });
      return await this.userService.getOneById(user.sub);
    } catch {
      return null;
    }
  }

  private setTokensInRequestAndResponse(
    req: Request,
    res: Response,
    user: User,
    newTokens: AuthToken,
  ): void {
    req.user = user;
    req.cookies[AuthService.AUTH_COOKIE_NAME] = newTokens;
    res.cookie(AuthService.AUTH_COOKIE_NAME, newTokens, {
      httpOnly: true,
      signed: true,
    });
  }

  handleRequest(_: any, user: any) {
    if (user) {
      return user;
    }
    throw new AuthError(AuthError.UNAUTHORIZED, 'Access token: Invalid JWT');
  }
}
