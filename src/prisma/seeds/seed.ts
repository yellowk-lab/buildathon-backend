import { main as seedProduction } from './production.seed';
import { main as seedDevelop } from './develop.seed';

const environment = process.env.PRISMA_SEED_ENV || 'production';

if (environment === 'production') {
  seedProduction();
} else if (environment === 'develop') {
  seedDevelop();
} else {
  console.error(`No seed file found for environment: ${environment}`);
}
