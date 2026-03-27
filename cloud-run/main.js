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

    // If no driver_id provided, find nearest online driver
    let assignedDriverId = driver_id;
    if (!assignedDriverId && origin_latitude && origin_longitude) {
      const nearestDriver = await sql`
        SELECT id,
          (6371 * acos(cos(radians(${origin_latitude})) * cos(radians(latitude))
          * cos(radians(longitude) - radians(${origin_longitude}))
          + sin(radians(${origin_latitude})) * sin(radians(latitude)))) AS distance
        FROM drivers
        WHERE is_online = true AND latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY distance ASC LIMIT 1
      `;
      if (nearestDriver.length > 0) {
        assignedDriverId = nearestDriver[0].id;
      }
    }

    const result = await sql`
      INSERT INTO rides (origin_address, destination_address, origin_latitude, origin_longitude,
        destination_latitude, destination_longitude, ride_time, fare_price, payment_status, status, driver_id, user_id)
      VALUES (${origin_address}, ${destination_address}, ${origin_latitude}, ${origin_longitude},
        ${destination_latitude}, ${destination_longitude}, ${ride_time}, ${fare_price},
        ${payment_status || 'pending'}, 'pending', ${assignedDriverId}, ${user_id})
      RETURNING *
    `;

    // Fetch driver details
    let driver = null;
    if (assignedDriverId) {
      const driverRows = await sql`SELECT first_name, last_name, car_seats FROM drivers WHERE id = ${assignedDriverId}`;
      driver = driverRows[0] || null;
    }
    res.json({ data: { ...result[0], driver } });
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

// ── Driver Portal ──

// Register driver
app.post('/api/driver/register', async (req, res) => {
  try {
    const { clerk_id, email, first_name, last_name, phone, car_make, car_model, car_year, car_color, car_seats, license_plate, license_number, profile_image_url } = req.body;
    if (!clerk_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'clerk_id, first_name, and last_name are required' });
    }
    const result = await sql`
      INSERT INTO drivers (clerk_id, email, first_name, last_name, phone, car_make, car_model, car_year, car_color, car_seats, license_plate, license_number, profile_image_url)
      VALUES (${clerk_id}, ${email || null}, ${first_name}, ${last_name}, ${phone || null},
        ${car_make || null}, ${car_model || null}, ${car_year || null}, ${car_color || null},
        ${car_seats || 4}, ${license_plate || null}, ${license_number || null}, ${profile_image_url || ''})
      RETURNING *
    `;
    res.json({ data: result[0] });
  } catch (e) {
    if (e.message?.includes('unique constraint') || e.message?.includes('duplicate key')) {
      return res.status(409).json({ error: 'Driver with this Clerk ID already exists' });
    }
    console.error('POST /api/driver/register error:', e.message);
    res.status(500).json({ error: 'Failed to register driver' });
  }
});

// Get driver profile by Clerk ID
app.get('/api/driver/profile/:clerkId', async (req, res) => {
  try {
    const drivers = await sql`SELECT * FROM drivers WHERE clerk_id = ${req.params.clerkId}`;
    if (drivers.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: drivers[0] });
  } catch (e) {
    console.error('GET /api/driver/profile error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update driver profile
app.put('/api/driver/profile/:clerkId', async (req, res) => {
  try {
    const { first_name, last_name, phone, car_make, car_model, car_year, car_color, car_seats, license_plate, license_number, profile_image_url } = req.body;
    const result = await sql`
      UPDATE drivers SET
        first_name = COALESCE(${first_name}, first_name),
        last_name = COALESCE(${last_name}, last_name),
        phone = COALESCE(${phone}, phone),
        car_make = COALESCE(${car_make}, car_make),
        car_model = COALESCE(${car_model}, car_model),
        car_year = COALESCE(${car_year}, car_year),
        car_color = COALESCE(${car_color}, car_color),
        car_seats = COALESCE(${car_seats}, car_seats),
        license_plate = COALESCE(${license_plate}, license_plate),
        license_number = COALESCE(${license_number}, license_number),
        profile_image_url = COALESCE(${profile_image_url}, profile_image_url)
      WHERE clerk_id = ${req.params.clerkId}
      RETURNING *
    `;
    if (result.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: result[0] });
  } catch (e) {
    console.error('PUT /api/driver/profile error:', e.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Toggle online/offline
app.patch('/api/driver/online/:clerkId', async (req, res) => {
  try {
    const { is_online, latitude, longitude } = req.body;
    const result = await sql`
      UPDATE drivers SET is_online = ${is_online},
        latitude = COALESCE(${latitude || null}, latitude),
        longitude = COALESCE(${longitude || null}, longitude)
      WHERE clerk_id = ${req.params.clerkId}
      RETURNING *
    `;
    if (result.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: result[0] });
  } catch (e) {
    console.error('PATCH /api/driver/online error:', e.message);
    res.status(500).json({ error: 'Failed to toggle online status' });
  }
});

// Available pending rides (for driver to see)
app.get('/api/driver/rides/pending', async (req, res) => {
  try {
    const rides = await sql`
      SELECT r.*, row_to_json(u.*) as customer
      FROM rides r
      LEFT JOIN users u ON r.user_id = u.clerk_id
      WHERE r.status = 'pending' AND r.driver_id IS NOT NULL
      ORDER BY r.created_at DESC
    `;
    const parsed = rides.map(r => ({
      ...r,
      customer: typeof r.customer === 'string' ? JSON.parse(r.customer) : r.customer,
    }));
    res.json({ data: parsed });
  } catch (e) {
    console.error('GET /api/driver/rides/pending error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Driver's current active ride
app.get('/api/driver/rides/active/:driverId', async (req, res) => {
  try {
    const rides = await sql`
      SELECT r.*, row_to_json(u.*) as customer
      FROM rides r
      LEFT JOIN users u ON r.user_id = u.clerk_id
      WHERE r.driver_id = ${req.params.driverId}
        AND r.status IN ('pending', 'accepted', 'en_route_pickup', 'arrived_pickup', 'in_progress')
      ORDER BY r.created_at DESC LIMIT 1
    `;
    if (rides.length === 0) return res.json({ data: null });
    const ride = rides[0];
    ride.customer = typeof ride.customer === 'string' ? JSON.parse(ride.customer) : ride.customer;
    res.json({ data: ride });
  } catch (e) {
    console.error('GET /api/driver/rides/active error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Driver ride history
app.get('/api/driver/rides/history/:driverId', async (req, res) => {
  try {
    const rides = await sql`
      SELECT r.*, row_to_json(u.*) as customer
      FROM rides r
      LEFT JOIN users u ON r.user_id = u.clerk_id
      WHERE r.driver_id = ${req.params.driverId}
        AND r.status IN ('completed', 'cancelled', 'driver_cancelled')
      ORDER BY r.created_at DESC
    `;
    const parsed = rides.map(r => ({
      ...r,
      customer: typeof r.customer === 'string' ? JSON.parse(r.customer) : r.customer,
    }));
    res.json({ data: parsed });
  } catch (e) {
    console.error('GET /api/driver/rides/history error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Driver earnings summary
app.get('/api/driver/earnings/:driverId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [todayEarnings, weekEarnings, totalEarnings] = await Promise.all([
      sql`SELECT COALESCE(SUM(net_amount), 0)::numeric as total FROM driver_earnings WHERE driver_id = ${req.params.driverId} AND created_at::date = ${today}`,
      sql`SELECT COALESCE(SUM(net_amount), 0)::numeric as total FROM driver_earnings WHERE driver_id = ${req.params.driverId} AND created_at >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COALESCE(SUM(net_amount), 0)::numeric as total, COUNT(*)::int as count FROM driver_earnings WHERE driver_id = ${req.params.driverId}`,
    ]);
    res.json({
      data: {
        today: parseFloat(todayEarnings[0].total),
        week: parseFloat(weekEarnings[0].total),
        total: parseFloat(totalEarnings[0].total),
        totalRides: totalEarnings[0].count,
      }
    });
  } catch (e) {
    console.error('GET /api/driver/earnings error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Driver earnings history
app.get('/api/driver/earnings/:driverId/history', async (req, res) => {
  try {
    const earnings = await sql`
      SELECT de.*, r.origin_address, r.destination_address
      FROM driver_earnings de
      LEFT JOIN rides r ON de.ride_id = r.ride_id
      WHERE de.driver_id = ${req.params.driverId}
      ORDER BY de.created_at DESC
    `;
    res.json({ data: earnings });
  } catch (e) {
    console.error('GET /api/driver/earnings/history error:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Ride Status Updates ──

const ALLOWED_TRANSITIONS = {
  customer: { pending: ['cancelled'] },
  driver: {
    pending: ['accepted', 'driver_cancelled'],
    accepted: ['en_route_pickup', 'driver_cancelled'],
    en_route_pickup: ['arrived_pickup', 'driver_cancelled'],
    arrived_pickup: ['in_progress'],
    in_progress: ['completed'],
  },
  admin: {
    pending: ['cancelled'], accepted: ['cancelled'], en_route_pickup: ['cancelled'],
    arrived_pickup: ['cancelled'], in_progress: ['cancelled'], completed: ['cancelled'],
    paid: ['refunded'], driver_cancelled: ['cancelled'],
  },
  system: {
    pending: ['accepted'], accepted: ['en_route_pickup'],
    en_route_pickup: ['arrived_pickup'], arrived_pickup: ['in_progress'],
    in_progress: ['completed'],
  },
};

app.patch('/api/rides/:id/status', async (req, res) => {
  try {
    const rideId = req.params.id;
    const { status, actor_type, actor_id, reason } = req.body;

    if (!status || !actor_type) {
      return res.status(400).json({ error: 'status and actor_type are required' });
    }

    // Fetch current ride
    const rides = await sql`SELECT * FROM rides WHERE ride_id = ${rideId}`;
    if (rides.length === 0) return res.status(404).json({ error: 'Ride not found' });

    const ride = rides[0];
    const currentStatus = ride.status || 'pending';

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[actor_type]?.[currentStatus];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${currentStatus}' to '${status}' as ${actor_type}`,
      });
    }

    // Build update fields
    const isCancellation = status === 'cancelled' || status === 'driver_cancelled';
    const now = new Date().toISOString();

    let result;
    if (isCancellation) {
      result = await sql`
        UPDATE rides SET status = ${status}, cancelled_by = ${actor_type},
          cancelled_at = ${now}, cancel_reason = ${reason || null}
        WHERE ride_id = ${rideId} RETURNING *
      `;
    } else if (status === 'accepted') {
      result = await sql`
        UPDATE rides SET status = ${status}, accepted_at = ${now}
        WHERE ride_id = ${rideId} RETURNING *
      `;
    } else if (status === 'arrived_pickup') {
      result = await sql`
        UPDATE rides SET status = ${status}, pickup_at = ${now}
        WHERE ride_id = ${rideId} RETURNING *
      `;
    } else if (status === 'completed') {
      result = await sql`
        UPDATE rides SET status = ${status}, completed_at = ${now}
        WHERE ride_id = ${rideId} RETURNING *
      `;
      // Create driver earnings record (20% commission)
      if (ride.driver_id && ride.fare_price) {
        const fareAmount = parseFloat(ride.fare_price);
        const commission = Math.round(fareAmount * 0.20 * 100) / 100;
        const netAmount = Math.round((fareAmount - commission) * 100) / 100;
        await sql`
          INSERT INTO driver_earnings (driver_id, ride_id, amount, commission, net_amount)
          VALUES (${ride.driver_id}, ${rideId}, ${fareAmount}, ${commission}, ${netAmount})
        `;
        await sql`
          UPDATE drivers SET
            total_earnings = total_earnings + ${netAmount},
            total_rides_completed = total_rides_completed + 1
          WHERE id = ${ride.driver_id}
        `;
      }
    } else if (status === 'refunded') {
      result = await sql`
        UPDATE rides SET status = ${status}, payment_status = 'refunded'
        WHERE ride_id = ${rideId} RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE rides SET status = ${status}
        WHERE ride_id = ${rideId} RETURNING *
      `;
    }

    // Log event
    await sql`
      INSERT INTO ride_events (ride_id, status, actor_type, actor_id, note)
      VALUES (${rideId}, ${status}, ${actor_type}, ${actor_id || null}, ${reason || null})
    `;

    res.json({ data: result[0] });
  } catch (e) {
    console.error('PATCH /api/rides/:id/status error:', e.message);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
});

// ── Admin: Update Payment Status ──

app.patch('/api/admin/rides/:id/payment', async (req, res) => {
  try {
    const { payment_status } = req.body;
    if (!payment_status) return res.status(400).json({ error: 'payment_status is required' });
    const result = await sql`
      UPDATE rides SET payment_status = ${payment_status}
      WHERE ride_id = ${req.params.id} RETURNING *
    `;
    if (result.length === 0) return res.status(404).json({ error: 'Ride not found' });
    res.json({ data: result[0] });
  } catch (e) {
    console.error('PATCH /api/admin/rides/:id/payment error:', e.message);
    res.status(500).json({ error: 'Failed to update payment status' });
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
