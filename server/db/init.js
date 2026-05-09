// init.js — pushes Prisma schema to Supabase on server start.
// This creates all tables automatically if they do not exist.
const { execSync } = require('child_process');

const initDB = () => {
  try {
    console.log('Initialising database...');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('Database initialised successfully');
  } catch (error) {
    console.error('Database initialisation failed:', error);
    process.exit(1);
  }
};

module.exports = initDB;
