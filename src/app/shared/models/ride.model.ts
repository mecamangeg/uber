export type RideStatus = 'pending' | 'accepted' | 'en_route_pickup' |
  'arrived_pickup' | 'in_progress' | 'completed' | 'cancelled' | 'driver_cancelled';

export interface Ride {
  ride_id?: number;
  origin_address: string;
  destination_address: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  ride_time: number;
  fare_price: number;
  payment_status: string;
  status: RideStatus;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  accepted_at?: string;
  pickup_at?: string;
  completed_at?: string;
  driver_id: number;
  user_id: string;
  created_at: string;
  driver: {
    first_name: string;
    last_name: string;
    car_seats: number;
  };
}
