import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { MagicService } from './magic.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  providers: [
    AuthResolver,
    AuthService,
    MagicService,
    JwtAccessStrategy,
    JwtAccessGuard,
    JwtService,
  ],
  exports: [AuthService, JwtAccessGuard, JwtService, UsersModule],
})
export class AuthModule {}
