import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { User as UserPrisma } from '@prisma/client';
import { User } from '../users/entities/users.entity';
import RegisterInput from './dto/register.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User)
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(
    @Args('token') token: string,
    @Args('input') input: RegisterInput,
    @Context() context: any,
  ) {
    const { user, authTokens } = await this.authService.register(token, input);
    context.res.cookie(AuthService.AUTH_COOKIE_NAME, authTokens, {
      httpOnly: true,
      signed: true,
    });
    return User.create(user);
  }

  @Mutation(() => User)
  async signIn(@Args('token') token: string, @Context() context: any) {
    const { user, authTokens } = await this.authService.signIn(token);
    context.res.cookie(AuthService.AUTH_COOKIE_NAME, authTokens, {
      httpOnly: true,
      signed: true,
    });
    return User.create(user);
  }

  @Mutation(() => Boolean)
  async signOut(@Context() context: any) {
    context.res.clearCookie(AuthService.AUTH_COOKIE_NAME);
    return true;
  }

  @Query(() => Boolean)
  async isEmailRegistered(@Args('email') email: string) {
    return this.authService.isUserAlreadyRegistered(email);
  }

  @UseGuards(JwtAccessGuard)
  @Query(() => User)
  async authenticatedUser(@CurrentUser() currentUser: UserPrisma) {
    return User.create(currentUser);
  }
}
