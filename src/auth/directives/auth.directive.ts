import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { AuthError } from '../auth.errors';

export function authDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string,
) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(
        schema,
        fieldConfig,
        directiveName,
      )?.[0];

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async function (source, args, context, info) {
          const user = context.req.user;
          const creatorId = source.creatorId;
          if (!user || user.id !== creatorId) {
            throw new AuthError(
              AuthError.FORBIDDEN,
              'Unauthorized: Forbidden resource field access',
            );
          }
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}
