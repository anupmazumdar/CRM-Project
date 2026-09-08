const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target || !['postgresql', 'sqlite'].includes(target)) {
  console.error('Usage: node scripts/switch-db.js [postgresql|sqlite]');
  process.exit(1);
}

// 1. Update prisma/schema.prisma datasource provider
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${target}"`);
fs.writeFileSync(schemaPath, schema, 'utf8');

// 2. Update .env DATABASE_URL
const envPath = path.join(__dirname, '..', '.env');
const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_udVFQk30bRol@ep-bitter-sky-aycblorq-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (target === 'sqlite') {
    // Preserve current postgres URL before replacing
    const currentDbUrlMatch = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    const currentDbUrl = currentDbUrlMatch ? currentDbUrlMatch[1] : '';

    if (currentDbUrl.startsWith('postgres') && !envContent.includes('POSTGRES_DATABASE_URL=')) {
      envContent += `\nPOSTGRES_DATABASE_URL="${currentDbUrl}"\n`;
    }

    if (envContent.match(/^DATABASE_URL=/m)) {
      envContent = envContent.replace(/^DATABASE_URL=.*$/m, 'DATABASE_URL="file:./dev.db"');
    } else {
      envContent = `DATABASE_URL="file:./dev.db"\n` + envContent;
    }
  } else if (target === 'postgresql') {
    // Retrieve saved postgres URL or default Neon URL
    const savedPgMatch = envContent.match(/^POSTGRES_DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    const pgUrl = savedPgMatch ? savedPgMatch[1] : DEFAULT_NEON_URL;

    if (envContent.match(/^DATABASE_URL=/m)) {
      envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${pgUrl}"`);
    } else {
      envContent = `DATABASE_URL="${pgUrl}"\n` + envContent;
    }
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
}

console.log(`✅ Prisma schema and .env successfully updated to: ${target}`);
