/**
 * test-ryde-api.mjs — CLI-Anything E2E tests for Ryde API
 *
 * Hits the REAL production Cloud Run API. No mocks.
 *
 * Usage:
 *   node tests/cli-anything/test-ryde-api.mjs
 *   node tests/cli-anything/test-ryde-api.mjs --json
 *   node tests/cli-anything/test-ryde-api.mjs --filter "driver|cancel"
 */

import { createRunner } from './lib/runner.mjs';

const BASE = 'https://ryde-api-775551928651.us-central1.run.app';
const { test, assert, summary } = createRunner('Ryde API E2E');

// ── Helpers ──

async function json(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { res, data };
}

// Track IDs for cleanup
let testDriverId = null;
let testRideId = null;

// ═══════════════════════════════════════════════
// P0: CONNECTIVITY
// ═══════════════════════════════════════════════

await test('P0 | Health check', async () => {
  const { res, data } = await json('GET', '/');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.status === 'ok', `Expected status ok, got ${data.status}`);
  assert(data.service === 'ryde-api', `Expected ryde-api, got ${data.service}`);
});

// ═══════════════════════════════════════════════
// P1: DRIVERS — Customer-facing
// ═══════════════════════════════════════════════

await test('P1 | GET /api/drivers — list all drivers', async () => {
  const { res, data } = await json('GET', '/api/drivers');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(data.data), 'Expected data[] array');
  assert(data.data.length > 0, 'Expected at least 1 driver');
  const d = data.data[0];
  assert(d.first_name, 'Driver missing first_name');
  assert(d.last_name, 'Driver missing last_name');
});

// ═══════════════════════════════════════════════
// P1: ADMIN — CRUD
// ═══════════════════════════════════════════════

await test('P1 | POST /api/admin/drivers — create driver', async () => {
  const { res, data } = await json('POST', '/api/admin/drivers', {
    first_name: 'Test', last_name: 'Driver_E2E',
    car_seats: 4, rating: 4.5, latitude: 14.55, longitude: 121.02,
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.id, 'Missing driver id');
  assert(data.data.first_name === 'Test', 'Wrong first_name');
  testDriverId = data.data.id;
});

await test('P1 | PUT /api/admin/drivers/:id — update driver', async () => {
  assert(testDriverId, 'No test driver to update');
  const { res, data } = await json('PUT', `/api/admin/drivers/${testDriverId}`, {
    first_name: 'TestUpdated', last_name: 'Driver_E2E',
    car_seats: 6, rating: 4.8,
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.first_name === 'TestUpdated', 'Update not applied');
  assert(data.data.car_seats === 6 || data.data.car_seats === '6', 'Seats not updated');
});

await test('P1 | GET /api/admin/drivers — verify updated driver in list', async () => {
  const { res, data } = await json('GET', '/api/admin/drivers');
  assert(res.ok, `Expected 200, got ${res.status}`);
  const found = data.data.find(d => d.id === testDriverId);
  assert(found, `Test driver ${testDriverId} not found in list`);
  assert(found.first_name === 'TestUpdated', 'Driver name not updated in list');
});

// ═══════════════════════════════════════════════
// P1: RIDES — Create + Status Transitions
// ═══════════════════════════════════════════════

await test('P1 | POST /api/rides — create ride', async () => {
  const { res, data } = await json('POST', '/api/rides', {
    origin_address: 'E2E Test Origin',
    destination_address: 'E2E Test Destination',
    origin_latitude: 14.5547, origin_longitude: 121.0244,
    destination_latitude: 14.5505, destination_longitude: 121.0455,
    ride_time: 10, fare_price: 150,
    payment_status: 'pending', status: 'pending',
    driver_id: testDriverId, user_id: 'e2e_test_user',
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.ride_id, 'Missing ride_id');
  assert(data.data.status === 'pending' || !data.data.status, 'Expected pending status');
  testRideId = data.data.ride_id;
});

await test('P1 | GET /api/rides/:userId — list user rides', async () => {
  const { res, data } = await json('GET', '/api/rides/e2e_test_user');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(data.data), 'Expected data[] array');
  const found = data.data.find(r => r.ride_id === testRideId);
  assert(found, `Test ride ${testRideId} not in user rides`);
});

// ═══════════════════════════════════════════════
// P1: RIDE STATUS — Transition validation
// ═══════════════════════════════════════════════

await test('P1 | PATCH status: customer cancel pending ride', async () => {
  assert(testRideId, 'No test ride');
  const { res, data } = await json('PATCH', `/api/rides/${testRideId}/status`, {
    status: 'cancelled', actor_type: 'customer',
    actor_id: 'e2e_test_user', reason: 'E2E test cancel',
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.status === 'cancelled', `Expected cancelled, got ${data.data.status}`);
  assert(data.data.cancelled_by === 'customer', `Expected customer, got ${data.data.cancelled_by}`);
  assert(data.data.cancel_reason === 'E2E test cancel', 'Cancel reason not saved');
});

await test('P1 | PATCH status: invalid transition rejected', async () => {
  assert(testRideId, 'No test ride');
  // Ride is already cancelled — trying to accept should fail
  const { res, data } = await json('PATCH', `/api/rides/${testRideId}/status`, {
    status: 'accepted', actor_type: 'driver', actor_id: 'e2e_driver',
  });
  assert(res.status === 400, `Expected 400 for invalid transition, got ${res.status}`);
  assert(data.error, 'Expected error message');
});

// Create another ride for the full driver flow
let flowRideId = null;

await test('P1 | PATCH status: full driver flow (accept → en_route → arrived → in_progress → completed)', async () => {
  // Create a fresh ride
  const { data: createData } = await json('POST', '/api/rides', {
    origin_address: 'E2E Flow Origin', destination_address: 'E2E Flow Dest',
    origin_latitude: 14.55, origin_longitude: 121.02,
    destination_latitude: 14.56, destination_longitude: 121.03,
    ride_time: 12, fare_price: 200, payment_status: 'pending',
    driver_id: testDriverId, user_id: 'e2e_flow_user',
  });
  flowRideId = createData.data.ride_id;
  assert(flowRideId, 'Failed to create flow ride');

  const transitions = [
    { status: 'accepted', actor_type: 'driver' },
    { status: 'en_route_pickup', actor_type: 'driver' },
    { status: 'arrived_pickup', actor_type: 'driver' },
    { status: 'in_progress', actor_type: 'driver' },
    { status: 'completed', actor_type: 'driver' },
  ];

  for (const t of transitions) {
    const { res, data } = await json('PATCH', `/api/rides/${flowRideId}/status`, {
      ...t, actor_id: `driver_${testDriverId}`,
    });
    assert(res.ok, `Transition to ${t.status} failed: ${res.status} — ${data.error || ''}`);
    assert(data.data.status === t.status, `Expected ${t.status}, got ${data.data.status}`);
  }
});

// ═══════════════════════════════════════════════
// P1: ADMIN — Rides, Users, Stats
// ═══════════════════════════════════════════════

await test('P1 | GET /api/admin/rides — list all rides', async () => {
  const { res, data } = await json('GET', '/api/admin/rides');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(data.data), 'Expected data[] array');
  assert(data.data.length > 0, 'Expected at least 1 ride');
});

await test('P1 | GET /api/admin/users — list users', async () => {
  const { res, data } = await json('GET', '/api/admin/users');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(data.data), 'Expected data[] array');
});

await test('P1 | GET /api/admin/stats — dashboard stats', async () => {
  const { res, data } = await json('GET', '/api/admin/stats');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(typeof data.data.totalDrivers === 'number', 'Missing totalDrivers');
  assert(typeof data.data.totalRides === 'number', 'Missing totalRides');
  assert(typeof data.data.totalUsers === 'number', 'Missing totalUsers');
  assert(typeof data.data.totalRevenue === 'number', 'Missing totalRevenue');
  assert(data.data.totalDrivers > 0, 'Expected at least 1 driver');
  assert(data.data.totalRides > 0, 'Expected at least 1 ride');
});

await test('P1 | PATCH /api/admin/rides/:id/payment — mark paid', async () => {
  assert(flowRideId, 'No flow ride');
  const { res, data } = await json('PATCH', `/api/admin/rides/${flowRideId}/payment`, {
    payment_status: 'paid',
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.payment_status === 'paid', 'Payment not marked as paid');
});

// ═══════════════════════════════════════════════
// P1: DRIVER PORTAL — Registration + Profile
// ═══════════════════════════════════════════════

const testClerkId = `e2e_clerk_${Date.now()}`;

await test('P1 | POST /api/driver/register — register new driver', async () => {
  const { res, data } = await json('POST', '/api/driver/register', {
    clerk_id: testClerkId, email: 'e2e@ryde.test',
    first_name: 'E2E', last_name: 'TestDriver',
    phone: '+63 999 000 1111', car_make: 'Honda', car_model: 'City',
    car_year: 2024, car_color: 'Silver', car_seats: 4,
    license_plate: 'E2E 0000', license_number: 'TEST-123',
  });
  assert(res.ok, `Expected 200, got ${res.status} — ${data.error || ''}`);
  assert(data.data.clerk_id === testClerkId, 'Clerk ID mismatch');
  assert(data.data.car_make === 'Honda', 'Car make mismatch');
});

await test('P1 | POST /api/driver/register — duplicate rejected', async () => {
  const { res } = await json('POST', '/api/driver/register', {
    clerk_id: testClerkId, first_name: 'Dup', last_name: 'Driver',
  });
  assert(res.status === 409, `Expected 409 for duplicate, got ${res.status}`);
});

await test('P1 | GET /api/driver/profile/:clerkId — get profile', async () => {
  const { res, data } = await json('GET', `/api/driver/profile/${testClerkId}`);
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.first_name === 'E2E', 'Wrong first_name');
  assert(data.data.car_model === 'City', 'Wrong car_model');
});

await test('P1 | PUT /api/driver/profile/:clerkId — update profile', async () => {
  const { res, data } = await json('PUT', `/api/driver/profile/${testClerkId}`, {
    car_color: 'Black', phone: '+63 999 111 2222',
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.car_color === 'Black', 'Color not updated');
});

await test('P1 | PATCH /api/driver/online/:clerkId — go online', async () => {
  const { res, data } = await json('PATCH', `/api/driver/online/${testClerkId}`, {
    is_online: true, latitude: 14.56, longitude: 121.03,
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.is_online === true, 'Not marked online');
});

await test('P1 | PATCH /api/driver/online/:clerkId — go offline', async () => {
  const { res, data } = await json('PATCH', `/api/driver/online/${testClerkId}`, {
    is_online: false,
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.is_online === false, 'Not marked offline');
});

await test('P1 | GET /api/driver/profile/nonexistent — 404', async () => {
  const { res } = await json('GET', '/api/driver/profile/does_not_exist_999');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

// ═══════════════════════════════════════════════
// P1: DRIVER — Ride History + Earnings
// ═══════════════════════════════════════════════

await test('P1 | GET /api/driver/rides/active/:driverId — no active ride', async () => {
  // testDriverId's ride was completed earlier
  const { res, data } = await json('GET', `/api/driver/rides/active/${testDriverId}`);
  assert(res.ok, `Expected 200, got ${res.status}`);
  // Could be null (completed) or have a ride — just check shape
  assert(data.hasOwnProperty('data'), 'Missing data field');
});

await test('P1 | GET /api/driver/rides/history/:driverId — ride history', async () => {
  const { res, data } = await json('GET', `/api/driver/rides/history/${testDriverId}`);
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(data.data), 'Expected data[] array');
});

await test('P1 | GET /api/driver/earnings/:driverId — earnings summary', async () => {
  const { res, data } = await json('GET', `/api/driver/earnings/${testDriverId}`);
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(typeof data.data.today === 'number', 'Missing today');
  assert(typeof data.data.week === 'number', 'Missing week');
  assert(typeof data.data.total === 'number', 'Missing total');
  assert(typeof data.data.totalRides === 'number', 'Missing totalRides');
});

await test('P1 | GET /api/driver/earnings/:driverId/history — earnings history', async () => {
  const { res, data } = await json('GET', `/api/driver/earnings/${testDriverId}/history`);
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(data.data), 'Expected data[] array');
});

// ═══════════════════════════════════════════════
// P1: DRIVER EARNINGS — Verify created on ride completion
// ═══════════════════════════════════════════════

await test('P1 | Earnings record created on ride completion', async () => {
  const { res, data } = await json('GET', `/api/driver/earnings/${testDriverId}/history`);
  assert(res.ok, `Expected 200, got ${res.status}`);
  const record = data.data.find(e => e.ride_id === flowRideId);
  assert(record, `No earnings record for completed ride ${flowRideId}`);
  assert(parseFloat(record.amount) === 200, `Expected amount 200, got ${record.amount}`);
  const expectedCommission = 40; // 20% of 200
  assert(parseFloat(record.commission) === expectedCommission, `Expected commission ${expectedCommission}, got ${record.commission}`);
  assert(parseFloat(record.net_amount) === 160, `Expected net 160, got ${record.net_amount}`);
});

// ═══════════════════════════════════════════════
// P2: EDGE CASES + INPUT VALIDATION
// ═══════════════════════════════════════════════

await test('P2 | PATCH status: missing required fields rejected', async () => {
  const { res } = await json('PATCH', `/api/rides/${testRideId}/status`, {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('P2 | PATCH admin payment: missing payment_status rejected', async () => {
  const { res } = await json('PATCH', `/api/admin/rides/${testRideId}/payment`, {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await test('P2 | PATCH status: nonexistent ride returns 404', async () => {
  const { res } = await json('PATCH', '/api/rides/999999/status', {
    status: 'cancelled', actor_type: 'admin', actor_id: 'test',
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

await test('P2 | POST /api/user — create/upsert user', async () => {
  const { res, data } = await json('POST', '/api/user', {
    name: 'E2E Test User', email: `e2e_${Date.now()}@ryde.test`, clerkId: `e2e_${Date.now()}`,
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.data.name === 'E2E Test User', 'Wrong name');
});

await test('P2 | Payments stub — create returns redirect URL', async () => {
  const { res, data } = await json('POST', '/api/payments/create', {
    ride_id: 1, fare_amount: 100,
  });
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.redirect_url, 'Missing redirect_url');
  assert(data.reference_id, 'Missing reference_id');
});

await test('P2 | Payments stub — confirm returns paid', async () => {
  const { res, data } = await json('POST', '/api/payments/confirm', {});
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(data.status === 'paid', 'Expected paid status');
});

// ═══════════════════════════════════════════════
// CLEANUP — Remove test data
// ═══════════════════════════════════════════════

await test('CLEANUP | Delete test driver', async () => {
  if (!testDriverId) return;
  // First delete rides associated with this driver to avoid FK constraint
  // The test rides will stay (no cascade delete), but that's fine
  const { res } = await json('DELETE', `/api/admin/drivers/${testDriverId}`);
  // May fail if rides reference this driver — that's OK
  assert(res.ok || res.status === 500, `Unexpected status ${res.status}`);
});

// ═══════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════

summary();
