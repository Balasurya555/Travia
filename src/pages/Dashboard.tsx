import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  Compass,
  Search,
  TrendingUp,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SettingsMenu from '@/components/SettingsMenu';
import { Trip, City } from '@/types/database';
import { format, differenceInDays } from 'date-fns';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [tripsRes, citiesRes] = await Promise.all([
        supabase
          .from('trips')
          .select('*')
          .eq('user_id', user?.id)
          .order('start_date', { ascending: true }),

        supabase
          .from('cities')
          .select('*')
          .order('popularity', { ascending: false })
          .limit(6),
      ]);

      if (tripsRes.data) setTrips(tripsRes.data as Trip[]);
      if (citiesRes.data) setCities(citiesRes.data as City[]);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };



  const filteredTrips = trips.filter((trip) =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingTrips = filteredTrips.filter(
    (trip) => new Date(trip.start_date) >= new Date()
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Compass className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Compass className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg">Travia</span>
          </Link>

          <div className="flex gap-3">
            <Link to="/explore">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" /> Explore
              </Button>
            </Link>
            <Link to="/my-trips">
              <Button variant="ghost" size="sm">
                <MapPin className="h-4 w-4 mr-2" /> My Trips
              </Button>
            </Link>
            <Link to="/trip-calendar">
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-2" /> Booked Dates
              </Button>
            </Link>
            <SettingsMenu />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold mb-1">Welcome back 👋</h1>
          <p className="text-muted-foreground">
            Plan, explore, and track your journeys
          </p>
        </motion.div>

        {/* SEARCH */}
        <Input
          placeholder="Search trips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md mb-8"
        />

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link to="/trips/new">
            <ActionCard
              icon={<Plus className="h-8 w-8" />}
              title="Plan New Trip"
              description="Start a new adventure"
            />
          </Link>

          <Link to="/explore">
            <ActionCard
              icon={<Search className="h-8 w-8" />}
              title="Explore Cities"
              description="Find destinations"
            />
          </Link>

          <Link to="/my-trips">
            <ActionCard
              icon={<MapPin className="h-8 w-8" />}
              title="View Trips"
              description={`${trips.length} planned`}
            />
          </Link>
        </div>

        {/* UPCOMING TRIPS */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Upcoming Trips</h2>

          {upcomingTrips.length === 0 ? (
            <p className="text-muted-foreground">No upcoming trips</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTrips.slice(0, 3).map((trip, index) => (
                <TripCard key={trip.id} trip={trip} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* TRENDING */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Trending Destinations</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city, index) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/explore?city=${city.id}`}>
                  <div className="rounded-xl overflow-hidden shadow hover:shadow-lg transition">
                    <img
                      src={city.image_url || '/placeholder.svg'}
                      alt={city.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Popular
                      </div>
                      <h3 className="font-semibold">{city.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {city.country}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function ActionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer">
      {icon}
      <h3 className="font-semibold text-lg mt-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const daysUntil = differenceInDays(new Date(trip.start_date), new Date());
  const duration =
    differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/trips/${trip.id}`}>
        <div className="bg-card rounded-xl overflow-hidden shadow hover:shadow-lg transition">
          <img
            src={trip.cover_image || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600'}
            alt={trip.name}
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold mb-2">{trip.name}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(trip.start_date), 'MMM d')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration} days
              </span>
              {trip.total_budget > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />${trip.total_budget}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
