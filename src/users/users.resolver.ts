import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { isEmail } from '../common/utils/email.util';
import { UsersFieldError } from './users.error';
import { MailService } from '../mail/mail.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: MailService
  ) {}

  @Mutation(() => User, { name: 'prizeDrawRegistration' })
  async createUserForPrizeDraw(@Args('email') email: string) {
    if (!isEmail(email)) {
      throw new UsersFieldError(
        UsersFieldError.EMAIL_CODES.INVALID_FORMAT,
        'Please provide a valid email address',
        { email: 'Invalid format' }
      );
    }
    const emailLowerCase = email.toLowerCase();
    const userExists = await this.usersService.getOneByEmail(emailLowerCase);
    if (userExists) {
      await this.emailService.sendPrizeDrawRegistration(userExists.email);
      const updatedUser = await this.usersService.updateDrawPrizeRegsitered(
        userExists.id,
        true
      );
      return updatedUser;
    }
    const newUser = await this.usersService.createUser(emailLowerCase, true);
    await this.emailService.sendPrizeDrawRegistration(newUser.email);
    return newUser;
  }
}
