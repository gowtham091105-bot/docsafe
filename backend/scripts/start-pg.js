import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve('./.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dbDir,
  port: 5432,
  user: 'docsafe_user',
  password: 'docsafe_password',
  persistent: true,
});

async function run() {
  if (!fs.existsSync(dbDir)) {
    console.log('Initialising DB...');
    await pg.initialise();
  }
  console.log('Starting DB on 5432...');
  await pg.start();
  try {
    await pg.createDatabase('docsafe_db');
    console.log('Database docsafe_db ready.');
  } catch (e) {
    // Already exists
  }
  console.log('PostgreSQL running! Keeping process alive...');
}

run().catch(console.error);

// Keep process alive
setInterval(() => {}, 1000 * 60 * 60);
