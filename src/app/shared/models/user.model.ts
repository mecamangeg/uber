export interface User {
  id: number;
  name: string;
  email: string;
  clerk_id: string;
  created_at: string;
}

export interface AdminStats {
  totalDrivers: number;
  totalRides: number;
  totalUsers: number;
  totalRevenue: number;
}
