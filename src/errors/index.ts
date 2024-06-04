import { BaseError } from './base.error';
import { FieldError } from './field.error';

const getInvalidFieldsFromObject = (obj: object) => {
  const invalidFields = {};
  for (const key in obj) {
    invalidFields[key] = `${obj[key]}`;
  }
  return invalidFields;
};

export { BaseError, FieldError, getInvalidFieldsFromObject };
