import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsDateOrTimestamp(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateOrTimestamp',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value instanceof Date) {
            const timestamp = value.getTime().toString();
            return timestamp.length >= 13;
          }

          if (!isNaN(value) && !isNaN(parseFloat(value))) {
            const timestampString = value.toString();
            if (timestampString.length >= 13) {
              const date = new Date(Number(value));
              return date > new Date('1970-01-01');
            } else {
              return false;
            }
          }

          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a Date object or a valid timestamp in milliseconds.`;
        },
      },
    });
  };
}
