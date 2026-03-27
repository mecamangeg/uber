const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pfatLGPox8s3@ep-winter-wildflower-anj8bfw8-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function setup() {
  console.log('Creating tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      profile_image_url TEXT,
      car_image_url TEXT,
      car_seats INTEGER DEFAULT 4,
      rating DECIMAL(2,1) DEFAULT 4.5,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7)
    )
  `;
  console.log('  drivers table created');

  await sql`
    CREATE TABLE IF NOT EXISTS rides (
      ride_id SERIAL PRIMARY KEY,
      origin_address TEXT NOT NULL,
      destination_address TEXT NOT NULL,
      origin_latitude DECIMAL(10,7) NOT NULL,
      origin_longitude DECIMAL(10,7) NOT NULL,
      destination_latitude DECIMAL(10,7) NOT NULL,
      destination_longitude DECIMAL(10,7) NOT NULL,
      ride_time INTEGER NOT NULL,
      fare_price DECIMAL(10,2) NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      status VARCHAR(30) DEFAULT 'pending',
      cancelled_by VARCHAR(20),
      cancelled_at TIMESTAMP,
      cancel_reason TEXT,
      accepted_at TIMESTAMP,
      pickup_at TIMESTAMP,
      completed_at TIMESTAMP,
      driver_id INTEGER REFERENCES drivers(id),
      user_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('  rides table created');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200) UNIQUE NOT NULL,
      clerk_id VARCHAR(200) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('  users table created');

  await sql`
    CREATE TABLE IF NOT EXISTS ride_events (
      id SERIAL PRIMARY KEY,
      ride_id INTEGER REFERENCES rides(ride_id),
      status VARCHAR(30) NOT NULL,
      actor_type VARCHAR(20) NOT NULL,
      actor_id VARCHAR(200),
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('  ride_events table created');

  // Migrate: add new columns to existing rides table (safe to re-run)
  const ridesColumns = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'status'
  `;
  if (ridesColumns.length === 0) {
    console.log('  Migrating rides table...');
    await sql`ALTER TABLE rides ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending'`;
    await sql`ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20)`;
    await sql`ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP`;
    await sql`ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancel_reason TEXT`;
    await sql`ALTER TABLE rides ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP`;
    await sql`ALTER TABLE rides ADD COLUMN IF NOT EXISTS pickup_at TIMESTAMP`;
    await sql`ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`;
    console.log('  rides table migrated');
  }

  // Driver earnings table
  await sql`
    CREATE TABLE IF NOT EXISTS driver_earnings (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER REFERENCES drivers(id),
      ride_id INTEGER REFERENCES rides(ride_id),
      amount DECIMAL(10,2) NOT NULL,
      commission DECIMAL(10,2) DEFAULT 0,
      net_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('  driver_earnings table created');

  // Migrate: add new columns to existing drivers table (safe to re-run)
  const driverColumns = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'clerk_id'
  `;
  if (driverColumns.length === 0) {
    console.log('  Migrating drivers table...');
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(200) UNIQUE`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email VARCHAR(200)`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS car_make VARCHAR(100)`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS car_model VARCHAR(100)`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS car_year INTEGER`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS car_color VARCHAR(50)`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20)`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number VARCHAR(100)`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12,2) DEFAULT 0`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_rides_completed INTEGER DEFAULT 0`;
    await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`;
    console.log('  drivers table migrated');
  }

  // Seed drivers
  const existingDrivers = await sql`SELECT COUNT(*) as count FROM drivers`;
  if (parseInt(existingDrivers[0].count) === 0) {
    console.log('Seeding drivers...');
    await sql`
      INSERT INTO drivers (first_name, last_name, profile_image_url, car_image_url, car_seats, rating, latitude, longitude) VALUES
      ('Carlos', 'Santos', 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/', 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-8a32-3236e1f0a2ca/-/preview/465x466/', 4, 4.9, 14.5547, 121.0244),
      ('Maria', 'Cruz', 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/', 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-8a32-3236e1f0a2ca/-/preview/465x466/', 4, 4.7, 14.5600, 121.0300),
      ('Juan', 'Reyes', 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/', 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-8a32-3236e1f0a2ca/-/preview/465x466/', 6, 4.8, 14.5500, 121.0400),
      ('Ana', 'Garcia', 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/', 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-8a32-3236e1f0a2ca/-/preview/465x466/', 4, 4.6, 14.5650, 121.0350)
    `;
    console.log('  4 drivers seeded');
  } else {
    console.log('  Drivers already seeded');
  }

  console.log('Done!');
}

setup().catch(console.error);
