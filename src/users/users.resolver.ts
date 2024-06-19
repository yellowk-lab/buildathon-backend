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
    private readonly emailService: MailService,
  ) {}
}
