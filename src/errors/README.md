Our error-handling strategy focuses on clear, precise, and actionable error messages. Errors are categorized into two types, each having unique error codes and messages. This two-level error hierarchy enables better error handling and improved user experience.

# **Overview**

Errors are categorized into two types:

- **`FieldError`**: Related to specific input fields.
- **`BaseError`**: General or system errors unrelated to specific input fields.

Each type of error is represented by unique error codes that help in identifying the specific error situation.

### **Error Types**

Error Types are general categories of errors that correspond to broad areas of functionality in our system. Each Error Type is represented by a JavaScript class that extends the **`BaseError`** class. Examples might include **`AuthError`** for authentication-related errors, **`DatabaseError`** for errors related to database operations, etc.

### **Error Codes**

Error Codes provide more specific information about what went wrong. Each Error Code is associated with a particular Error Type and is represented by a static member on the corresponding Error Type class.

### **Error Fields**

Error Fields represent the specific fields related to the error, for parameter errors. This can be used to highlight the problematic fields in the frontend.

---

# **Implementation**

For each Error Type, we create a class that extends **`BaseError` or `FieldError`**. Error Codes are defined as static properties on these classes. Both of these classes will extend the `**GraphQLError`** class. The differences between them will be that `**FieldError**` will have records of the fields that caused the error. 

For **general standard error codes**, the `ApolloServerErrorCode` enumeration of the `@apollo/server/errors` library will be wrapped inside the classes to be used for the most common errors across the environment. An example would be the INTERNAL_SERVER_ERROR.

> **Note**
As error classes inherit from `**GraphQLError**` class (starting from [Apollo Server v4](https://www.apollographql.com/docs/apollo-server/)), there will be a regression due to Apollo Server providing invalid variables which yields only a 200 status code instead of 400 (or 500).
To mitigate this, [see migration guide](https://www.apollographql.com/docs/apollo-server/migration/#known-regressions). 
To learn more go [here](https://www.apollographql.com/docs/apollo-server/data/errors)
> 

## Field Error Class

**`FieldError`** is intended for field-related errors. These errors are typically caused by incorrect user input, such as a malformed email address or a password that doesn't meet security requirements.

To standardize error codes across the various **Specific Error Classes** and to avoid unnecessary code, a file containing the most common fields errors codes is imported inside the main `**FieldError**` class. As many **Specific Error Classes** will share common general fields errors, a static array variable containing general codes errors is already shipped with the main class.

Here's the definition of the **`FieldError`** class:

```tsx
import { GraphQLError } from "graphql";
import { GENERAL_CODES_ERRORS, EMAIL_CODES_ERRORS, PASSWORD_CODES_ERRORS  } from "./fields-codes";
import { ApolloServerErrorCode } from '@apollo/server/errors';

export class FieldError extends GraphQLError {

  static GENERAL_CODES = GENERAL_CODES_ERRORS;
  static SERVER_CODES = ApolloServerErrorCode;
  static EMAIL_CODES = EMAIL_CODES_ERRORS;
  static PASSWORD_CODES = PASSWORD_CODES_ERRORS;

  constructor(code: string, message: string, fields: Record<string, string>, options?: Record<string, any>) {
    super(message, {
      extensions: {
        code: code,
        fields: fields,
        ...options,
      }
    });
    this.name = this.constructor.name;
  }

  get type() {
    return this.name;
  }
}
```

## Base Error Class

**`BaseError`** is intended for all other errors. These are typically system-related errors, such as a database failure or an external API error.

The **`BaseError`** class extends GraphQL's `**GraphQLError**` class. When a **`BaseError`** is thrown, the server responds with an HTTP 200 (instead of 500 due to GraphQL) status code (Internal Server Error), indicating that the server encountered an unexpected condition that prevented it from fulfilling the request.

**By default**, the **`BaseError`** class is constructed with a default parameters that throw an INTERNAL_SERVER_ERROR.

Here's the definition of the **`BaseError`** class:

```tsx
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from '@apollo/server/errors';

export class BaseError extends GraphQLError {

  static SERVER_CODES = ApolloServerErrorCode;

  constructor(code: string = BaseError.SERVER_CODES.INTERNAL_SERVER_ERROR, message: string = 'Internal server error', options?: Record<string, any>) {
    super(message, {
      extensions: {
        code: code,
        ...options,
      }
    });
    this.name = this.constructor.name;
  }

  get type() {
    return this.name;
  }
}
```

## Specific Error Classes

You can then extend these base classes to create specific errors. Here's an example:

```tsx
import { BaseError, FieldError } from '@module/errors';

export class AuthError extends BaseError {
  static UNAUTHENTICATED = 'UNAUTHENTICATED';
  static UNAUTHORIZED = 'UNAUTHORIZED';
  static WRONG_CREDENTIALS = 'WRONG_CREDENTIALS';
  static LOGOUT_FAILED = 'LOGOUT_FAILED';
  static USER_NOT_FOUND = 'USER_NOT_FOUND';

  constructor(code: string, message: string) {
    super(code, message);
  }
}
```

## Throwing Errors

### Base Errors

To throw an error, you create a new instance of the appropriate error class, like so:

```tsx
import { AuthError } from '@module/errors';

if (!user) {
  throw new AuthError(AuthError.USER_NOT_FOUND, 'User not found');
}
```

```tsx

import { BaseError } from '@module/errors';

// Throw default INTERNAL_SERVOR_ERROR
if(error) {
	throw new BaseError();
}
```

### Field Errors

Here is an example demonstrating how to generate an **`invalidFields`** object and use it to throw a `**RegistrationFieldError**`:

```tsx
let invalidFields = {};

if (!emailRegex.test(email)) {
  invalidFields['email'] = RegistrationFieldError.EMAIL_FIELDS_CODES.ALREADY_EXISTS;
}

if (password.length < 8) {
  invalidFields['password'] = 'Password must be at least 8 characters long';
}

if (Object.keys(invalidFields).length > 0) {
  throw new RegistrationFieldError(
		RegistrationFieldError.INVALID_INPUT, 'Invalid input', invalidFields
	);
}
```

In this example, we're checking an email and a password for validity. If either or both are invalid, we add an entry to the **`invalidFields`** object and then throw a **`FieldError`** with the **`invalidFields`** object included. The keys of the **`invalidFields`** object correspond to the invalid parameters, and the values are descriptions of what's wrong with each one.

This would result in an error like this:

```json
{
  "errors": [
    {
      "message": "Invalid input",
      "locations": [],
      "extensions": {
        "code": "invalid_input",
        "fields": {
          "email": "Invalid email format",
          "password": "Password must be at least 8 characters long"
        }
      }
    }
  ]
}
```

This approach provides clear indications about what the problem is and where it lies, allowing the frontend to show the user exactly what they need to fix.

**In case of multiple fields errors**, we use the getInvalidFieldsFromObject helper function imported from the error module:

```tsx
import { getInvalidFieldsFromObject } from '@module/errors';
import { RegistrationFieldError } from '@module/auth/error';

if (response.data.errors) {
  const invalidFields = getInvalidFieldsFromObject(data.errors);
  throw new RegistrationFieldError(
    RegistrationFieldError.GENERAL_CODES.UNPROCESSABLE_ENTITY,
    'The data received could not be proccessed',
    invalidFields
  );
}
```

---

# **Benefits**

This error handling strategy provides several benefits:

1. **Flexibility**: By categorizing errors into types and further into unique codes, we allow for a high degree of precision in error handling while retaining the ability to catch and handle general error types when necessary.
2. **Clarity**: By following HTTP conventions and using clear, descriptive error codes, we make it easy to understand what each error signifies.
3. **Ease of use**: Throwing and catching errors is as simple as working with any JavaScript class or object. This simplicity increases developer productivity and reduces the chance of mistakes.
4. **Scalability**: New error types and codes can easily be added as the application grows and new needs arise.

By following this approach, we can ensure a more consistent, precise, and scalable error handling strategy that can significantly improve the debugging and development process.