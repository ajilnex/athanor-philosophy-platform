const { execSync } = require('node:child_process');

const isProd = (process.env.VERCEL_ENV === 'production') || (process.env.NODE_ENV === 'production');

execSync('npx prisma generate', { stdio:'inherit' });
execSync(isProd ? 'npx prisma migrate deploy' : 'npx prisma db push', { stdio:'inherit' });

try {
  execSync('node scripts/migrate-billets-to-db.js', { stdio:'inherit' });
} catch (e) {
  console.warn('⚠️ migrate-billets: erreur non bloquante (build continue).', e?.message || e);
}

execSync('npx next build', { stdio:'inherit' });
