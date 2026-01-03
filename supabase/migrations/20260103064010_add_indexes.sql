-- Add database indexes for performance optimization
-- These indexes improve query performance for common access patterns

-- Trips table indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id_start_date ON public.trips(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_trips_is_public ON public.trips(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_end_date ON public.trips(end_date);

-- Trip stops indexes
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id ON public.trip_stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_city_id ON public.trip_stops(city_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id_order ON public.trip_stops(trip_id, order_index);

-- Stop activities indexes
CREATE INDEX IF NOT EXISTS idx_stop_activities_stop_id ON public.stop_activities(stop_id);
CREATE INDEX IF NOT EXISTS idx_stop_activities_activity_id ON public.stop_activities(activity_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_city_id ON public.activities(city_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_rating ON public.activities(rating DESC);

-- Cities indexes
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country);
CREATE INDEX IF NOT EXISTS idx_cities_popularity ON public.cities(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_cities_name_trgm ON public.cities USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cities_country_trgm ON public.cities USING gin(country gin_trgm_ops);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Enable pg_trgm extension for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_trips_public_upcoming ON public.trips(is_public, start_date) WHERE is_public = TRUE AND start_date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_activities_city_category ON public.activities(city_id, category) WHERE city_id IS NOT NULL;

