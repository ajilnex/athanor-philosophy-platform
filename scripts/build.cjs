const { execSync } = require('node:child_process');

const isProd = (process.env.VERCEL_ENV === 'production') || (process.env.NODE_ENV === 'production');

execSync('npx prisma generate', { stdio:'inherit' });
execSync(isProd ? 'npx prisma db push' : 'npx prisma db push', { stdio:'inherit' });

// NOTE: Billets sont maintenant 100% statiques (filesystem uniquement)
// La synchronisation DB a été désactivée pour éviter les conflits
console.log('📝 Billets: Mode statique (pas de sync DB)');

execSync('npx next build', { stdio:'inherit' });
