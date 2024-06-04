## Description

This is the basic template of backend using Nestjs.

### Using / Includes

- Apollo Server for GraphQL
- Prisma for ORM
- Docker for environment
- Faker for generating testing data

## Setup

Copy the `.env.example`, rename it to `.env` and enter the values you need.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ docker-compose up --build
```

## Running migrations

```bash
$ npx prisma migrate dev --name <the-migration-name>
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

UNLICENSED and belongs to YellowK Labs.

<!-- Adding this line to trigger pipeline. -->
