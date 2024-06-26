import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphQLError, GraphQLErrorExtensions } from 'graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module';
import { CoreModule } from './core/core.module';
import { UsersModule } from './users/users.module';
import { MomentModule } from './core/moment/moment.module';
import { LootBoxesModule } from './loot-boxes/loot-boxes.module';
import { HttpModule } from './http/http.module';
import { MailModule } from './mail/mail.module';
import { EventsModule } from './events/events.module';
import { Web3Module } from './web3/web3.module';
import { LocationsModule } from './locations/locations.module';
import { OrdersModule } from './orders/orders.module';

interface ExceptionType extends GraphQLErrorExtensions {
  status?: string | undefined;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      context: ({ req, res }) => {
        return { req, res };
      },
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      formatError: (error: GraphQLError) => {
        if (!error.extensions.exception) {
          return error;
        }
        let status = (error.extensions.exception as ExceptionType)?.code;
        if ((error.extensions.exception as ExceptionType).status) {
          status = (error.extensions.exception as ExceptionType).status;
        }
        return {
          ...error,
          extensions: {
            ...error.extensions,
            exception: {
              ...(error.extensions.exception as ExceptionType),
              code: status,
            },
          },
        };
      },
    }),
    PrismaModule,
    MomentModule,
    CoreModule,
    UsersModule,
    LootBoxesModule,
    HttpModule,
    MailModule,
    EventsModule,
    Web3Module,
    LocationsModule,
    OrdersModule,
  ],
})
export class AppModule {}
