const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target || !['postgresql', 'sqlite'].includes(target)) {
  console.error('Usage: node scripts/switch-db.js [postgresql|sqlite]');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

schema = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${target}"`);
fs.writeFileSync(schemaPath, schema, 'utf8');

console.log(`✅ Prisma schema provider successfully updated to: ${target}`);
