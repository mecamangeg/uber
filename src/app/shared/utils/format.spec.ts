import { formatTime, formatDate, sortRides } from './format';
import type { Ride } from '../models/ride.model';

describe('formatTime', () => {
  it('should format minutes under 60', () => {
    expect(formatTime(25)).toBe('25 min');
    expect(formatTime(1)).toBe('1 min');
  });

  it('should format minutes over 60 as hours and minutes', () => {
    expect(formatTime(90)).toBe('1h 30m');
    expect(formatTime(125)).toBe('2h 5m');
  });

  it('should handle exactly 60 minutes', () => {
    expect(formatTime(60)).toBe('1h 0m');
  });

  it('should handle zero', () => {
    expect(formatTime(0)).toBe('0 min');
  });
});

describe('formatDate', () => {
  it('should format date string correctly', () => {
    const result = formatDate('2026-03-05');
    expect(result).toBe('05 March 2026');
  });

  it('should not pad day > 9', () => {
    const result = formatDate('2026-12-25');
    expect(result).toBe('25 December 2026');
  });

  it('should pad single-digit day', () => {
    const result = formatDate('2026-01-03');
    expect(result).toBe('03 January 2026');
  });
});

describe('sortRides', () => {
  it('should sort rides by created_at + ride_time', () => {
    const rides: Ride[] = [
      {
        ride_id: 1, origin_address: 'A', destination_address: 'B',
        origin_latitude: 0, origin_longitude: 0, destination_latitude: 0, destination_longitude: 0,
        ride_time: 10, fare_price: 100, payment_status: 'paid', driver_id: 1, user_id: 'u1',
        created_at: '2026-03-02', driver: { first_name: 'A', last_name: 'B', car_seats: 4 },
      },
      {
        ride_id: 2, origin_address: 'A', destination_address: 'B',
        origin_latitude: 0, origin_longitude: 0, destination_latitude: 0, destination_longitude: 0,
        ride_time: 5, fare_price: 50, payment_status: 'paid', driver_id: 1, user_id: 'u1',
        created_at: '2026-03-01', driver: { first_name: 'C', last_name: 'D', car_seats: 4 },
      },
    ];

    const sorted = sortRides(rides);
    expect(sorted.length).toBe(2);
  });

  it('should handle empty array', () => {
    expect(sortRides([])).toEqual([]);
  });
});
