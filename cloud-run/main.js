const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
app.use(cors());
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'ryde-api' }));

// Drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await sql`SELECT * FROM drivers`;
    res.json({ data: drivers });
  } catch (e) {
    console.error('GET /api/drivers error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Rides
app.get('/api/rides/:userId', async (req, res) => {
  try {
    const rides = await sql`
      SELECT r.*, row_to_json(d.*) as driver
      FROM rides r
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.user_id = ${req.params.userId}
      ORDER BY r.created_at DESC
    `;
    // Parse driver JSON from row_to_json
    const parsed = rides.map(r => ({
      ...r,
      driver: typeof r.driver === 'string' ? JSON.parse(r.driver) : r.driver,
    }));
    res.json({ data: parsed });
  } catch (e) {
    console.error('GET /api/rides error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/rides', async (req, res) => {
  try {
    const {
      origin_address, destination_address, origin_latitude, origin_longitude,
      destination_latitude, destination_longitude, ride_time, fare_price,
      payment_status, driver_id, user_id
    } = req.body;

    const result = await sql`
      INSERT INTO rides (origin_address, destination_address, origin_latitude, origin_longitude,
        destination_latitude, destination_longitude, ride_time, fare_price, payment_status, driver_id, user_id)
      VALUES (${origin_address}, ${destination_address}, ${origin_latitude}, ${origin_longitude},
        ${destination_latitude}, ${destination_longitude}, ${ride_time}, ${fare_price},
        ${payment_status || 'pending'}, ${driver_id}, ${user_id})
      RETURNING *
    `;

    // Fetch driver details
    const driver = await sql`SELECT first_name, last_name, car_seats FROM drivers WHERE id = ${driver_id}`;
    res.json({ data: { ...result[0], driver: driver[0] || null } });
  } catch (e) {
    console.error('POST /api/rides error:', e.message);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Users
app.post('/api/user', async (req, res) => {
  try {
    const { name, email, clerkId } = req.body;
    const result = await sql`
      INSERT INTO users (name, email, clerk_id)
      VALUES (${name}, ${email}, ${clerkId})
      ON CONFLICT (clerk_id) DO UPDATE SET name = ${name}
      RETURNING *
    `;
    res.json({ data: result[0] });
  } catch (e) {
    console.error('POST /api/user error:', e.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Payments (stub — returns test checkout URL)
app.post('/api/payments/create', async (req, res) => {
  try {
    const { ride_id, fare_amount } = req.body;
    res.json({
      redirect_url: `https://checkout.xendit.co/web/test_${Date.now()}`,
      reference_id: `ride_${ride_id}_${Date.now()}`
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.post('/api/payments/confirm', async (req, res) => {
  try {
    // In production, this would check Xendit payment status
    res.json({ status: 'paid' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to check payment' });
  }
});

// ── Admin: Drivers CRUD ──

app.get('/api/admin/drivers', async (req, res) => {
  try {
    const drivers = await sql`SELECT * FROM drivers ORDER BY id`;
    res.json({ data: drivers });
  } catch (e) {
    console.error('GET /api/admin/drivers error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/admin/drivers', async (req, res) => {
  try {
    const { first_name, last_name, profile_image_url, car_image_url, car_seats, rating, latitude, longitude } = req.body;
    const result = await sql`
      INSERT INTO drivers (first_name, last_name, profile_image_url, car_image_url, car_seats, rating, latitude, longitude)
      VALUES (${first_name}, ${last_name}, ${profile_image_url || ''}, ${car_image_url || ''}, ${car_seats || 4}, ${rating || 4.5}, ${latitude || null}, ${longitude || null})
      RETURNING *
    `;
    res.json({ data: result[0] });
  } catch (e) {
    console.error('POST /api/admin/drivers error:', e.message);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

app.put('/api/admin/drivers/:id', async (req, res) => {
  try {
    const { first_name, last_name, profile_image_url, car_image_url, car_seats, rating, latitude, longitude } = req.body;
    const result = await sql`
      UPDATE drivers SET
        first_name = ${first_name}, last_name = ${last_name},
        profile_image_url = ${profile_image_url || ''}, car_image_url = ${car_image_url || ''},
        car_seats = ${car_seats || 4}, rating = ${rating || 4.5},
        latitude = ${latitude || null}, longitude = ${longitude || null}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (result.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: result[0] });
  } catch (e) {
    console.error('PUT /api/admin/drivers error:', e.message);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

app.delete('/api/admin/drivers/:id', async (req, res) => {
  try {
    const result = await sql`DELETE FROM drivers WHERE id = ${req.params.id} RETURNING id`;
    if (result.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: { id: result[0].id } });
  } catch (e) {
    console.error('DELETE /api/admin/drivers error:', e.message);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

// ── Admin: Rides ──

app.get('/api/admin/rides', async (req, res) => {
  try {
    const rides = await sql`
      SELECT r.*, row_to_json(d.*) as driver
      FROM rides r
      LEFT JOIN drivers d ON r.driver_id = d.id
      ORDER BY r.created_at DESC
    `;
    const parsed = rides.map(r => ({
      ...r,
      driver: typeof r.driver === 'string' ? JSON.parse(r.driver) : r.driver,
    }));
    res.json({ data: parsed });
  } catch (e) {
    console.error('GET /api/admin/rides error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Admin: Users ──

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    res.json({ data: users });
  } catch (e) {
    console.error('GET /api/admin/users error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Admin: Stats ──

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [drivers, rides, users, revenue] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM drivers`,
      sql`SELECT COUNT(*)::int as count FROM rides`,
      sql`SELECT COUNT(*)::int as count FROM users`,
      sql`SELECT COALESCE(SUM(fare_price), 0)::numeric as total FROM rides WHERE payment_status = 'paid'`,
    ]);
    res.json({
      data: {
        totalDrivers: drivers[0].count,
        totalRides: rides[0].count,
        totalUsers: users[0].count,
        totalRevenue: parseFloat(revenue[0].total),
      }
    });
  } catch (e) {
    console.error('GET /api/admin/stats error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Ryde API running on port ${PORT}`));
