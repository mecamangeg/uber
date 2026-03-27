export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  car_image_url: string;
  car_seats: number;
  rating: number;
  latitude?: number;
  longitude?: number;
}

export interface MarkerData extends Driver {
  latitude: number;
  longitude: number;
  title: string;
  time?: number;
  price?: string;
}
