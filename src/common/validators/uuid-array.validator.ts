import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isUUID } from 'class-validator';

export function IsUUIDArray(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isUUIDArray',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === undefined) {
            return true;
          }
          if (!Array.isArray(value)) {
            return false;
          }
          return value.every((item: any) => isUUID(item, 'all'));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an array of valid UUIDs or undefined.`;
        },
      },
    });
  };
}
