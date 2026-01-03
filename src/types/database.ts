export interface City {
  id: string;
  name: string;
  country: string;
  country_code: string | null;
  image_url: string | null;
  cost_index: number;
  popularity: number;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Activity {
  id: string;
  city_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  duration_hours: number;
  estimated_cost: number;
  image_url: string | null;
  rating: number;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  is_public: boolean;
  total_budget: number;
  created_at: string;
  updated_at: string;
}

export interface TripStop {
  id: string;
  trip_id: string;
  city_id: string | null;
  city_name: string;
  country: string | null;
  arrival_date: string;
  departure_date: string;
  order_index: number;
  notes: string | null;
  accommodation_cost: number;
  transport_cost: number;
  created_at: string;
}

export interface StopActivity {
  id: string;
  stop_id: string;
  activity_id: string | null;
  custom_name: string | null;
  custom_cost: number;
  scheduled_date: string | null;
  scheduled_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}
