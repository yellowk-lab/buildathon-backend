import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLError,
  GraphQLErrorExtensions,
} from 'graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module';
import { CoreModule } from './core/core.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DigitalOceanModule } from './digital-ocean/digital-ocean.module';
import { MomentModule } from './core/moment/moment.module';
import { authDirectiveTransformer } from './auth/directives/auth.directive';

interface ExceptionType extends GraphQLErrorExtensions {
  status?: string | undefined;
}

@Module({
  imports: [
    EventEmitterModule.forRoot(),
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
      transformSchema: (schema) => authDirectiveTransformer(schema, 'auth'),
      buildSchemaOptions: {
        directives: [
          new GraphQLDirective({
            name: 'auth',
            locations: [DirectiveLocation.FIELD_DEFINITION],
          }),
        ],
      },
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
    DigitalOceanModule,
    AuthModule,
  ],
})
export class AppModule {}
