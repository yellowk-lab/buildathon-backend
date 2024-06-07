###################
# BUILD FOR LOCAL DEVELOPMENT
###################

# Update to node:18 instead of node:18-alpine to fix Prisma error
# happening with M1 chips. 
# Also, we need to include the --platform flag in the FROM command, to make sure docker 
# builds an AMD64 based image. The issue happens for mac users with an Apple
# Silicon (M1 chip and above). See for more info: https://medium.com/geekculture/from-apple-silicon-to-heroku-docker-registry-without-swearing-36a2f59b30a3
FROM --platform=linux/amd64 node:18 As development

# Required for Prisma Client to work in container
RUN apt-get update && apt-get install -y openssl --no-install-recommends

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./
# COPY --chown=node:node prisma ./prisma/

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN npm ci

# Temporary solution to fix platform dependency issues
RUN npm i --save-dev @css-inline/css-inline-linux-x64-gnu

# Bundle app source
COPY --chown=node:node . .

# Generate Prisma database client code
RUN npm run prisma:generate

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM --platform=linux/amd64 node:18 As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN npm run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# MIGRATE DB FOR PRODUCTION
###################

FROM --platform=linux/amd64 node:18 As migration

ARG DATABASE_URL_BUILD
ENV DATABASE_URL=$DATABASE_URL_BUILD

# Create app directory
WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/src/prisma ./prisma

# Deploy Prisma migrations to the database
RUN npx prisma migrate deploy --schema ./prisma/schema.prisma

###################
# PRODUCTION
###################
FROM --platform=linux/amd64 node:18 As production

# Create app directory
WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/src/prisma ./prisma

# Start the server using the production build
CMD [ "node", "dist/main.js" ]

