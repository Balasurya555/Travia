-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  total_budget DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create cities table (reference data)
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT,
  image_url TEXT,
  cost_index INTEGER DEFAULT 50,
  popularity INTEGER DEFAULT 50,
  description TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create trip_stops table
CREATE TABLE public.trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  city_name TEXT NOT NULL,
  country TEXT,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  accommodation_cost DECIMAL(10,2) DEFAULT 0,
  transport_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create activities table (reference data)
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_hours DECIMAL(4,2) DEFAULT 2,
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 4.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create stop_activities table (junction table)
CREATE TABLE public.stop_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id UUID REFERENCES public.trip_stops(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_cost DECIMAL(10,2) DEFAULT 0,
  scheduled_date DATE,
  scheduled_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trips policies
CREATE POLICY "Users can view their own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert their own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- Cities policies (public read)
CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (TRUE);

-- Trip stops policies
CREATE POLICY "Users can view stops of their trips" ON public.trip_stops FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND (trips.user_id = auth.uid() OR trips.is_public = TRUE)));
CREATE POLICY "Users can insert stops to their trips" ON public.trip_stops FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users can update stops of their trips" ON public.trip_stops FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users can delete stops of their trips" ON public.trip_stops FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND trips.user_id = auth.uid()));

-- Activities policies (public read)
CREATE POLICY "Anyone can view activities" ON public.activities FOR SELECT USING (TRUE);

-- Stop activities policies
CREATE POLICY "Users can view stop activities of their trips" ON public.stop_activities FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.trip_stops ts 
    JOIN public.trips t ON t.id = ts.trip_id 
    WHERE ts.id = stop_activities.stop_id AND (t.user_id = auth.uid() OR t.is_public = TRUE)
  ));
CREATE POLICY "Users can insert stop activities to their trips" ON public.stop_activities FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trip_stops ts 
    JOIN public.trips t ON t.id = ts.trip_id 
    WHERE ts.id = stop_activities.stop_id AND t.user_id = auth.uid()
  ));
CREATE POLICY "Users can update stop activities of their trips" ON public.stop_activities FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.trip_stops ts 
    JOIN public.trips t ON t.id = ts.trip_id 
    WHERE ts.id = stop_activities.stop_id AND t.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete stop activities of their trips" ON public.stop_activities FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.trip_stops ts 
    JOIN public.trips t ON t.id = ts.trip_id 
    WHERE ts.id = stop_activities.stop_id AND t.user_id = auth.uid()
  ));

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();