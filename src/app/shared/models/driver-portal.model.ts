export interface DriverProfile {
  id: number;
  clerk_id: string;
  email?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_image_url?: string;
  car_image_url?: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  car_color?: string;
  car_seats: number;
  license_plate?: string;
  license_number?: string;
  rating: number;
  is_online: boolean;
  is_verified: boolean;
  total_earnings: number;
  total_rides_completed: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface DriverEarnings {
  today: number;
  week: number;
  total: number;
  totalRides: number;
}

export interface DriverEarningRecord {
  id: number;
  driver_id: number;
  ride_id: number;
  amount: number;
  commission: number;
  net_amount: number;
  status: string;
  origin_address?: string;
  destination_address?: string;
  created_at: string;
}

export interface DriverRegistration {
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  car_make: string;
  car_model: string;
  car_year: number;
  car_color: string;
  car_seats: number;
  license_plate: string;
  license_number: string;
}

export interface RideRequest {
  ride_id: number;
  origin_address: string;
  destination_address: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  ride_time: number;
  fare_price: number;
  status: string;
  customer?: {
    name: string;
    email: string;
  };
  created_at: string;
}
