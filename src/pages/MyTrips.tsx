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
  Trash2,
  Edit2,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trip } from '@/types/database';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

// SettingsMenu is displayed on the home/dashboard — removed from this page

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MyTrips() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]);

  async function fetchTrips() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTrips((data || []) as Trip[]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTrip(tripId: string) {
    try {
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) throw error;

      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      toast.success('Trip deleted');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  }

  const filteredTrips = trips.filter((trip) => {
    const now = new Date();
    const end = new Date(trip.end_date);

    if (filter === 'upcoming') return end >= now;
    if (filter === 'past') return end < now;
    return true;
  });

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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Compass className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Travia</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/explore">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Explore
              </Button>
            </Link>

            <Link to="/my-trips">
              <Button variant="ghost" size="sm" className="bg-accent">
                <MapPin className="h-4 w-4 mr-2" />
                My Trips
              </Button>
            </Link>

            <Link to="/trips/new">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Trip
              </Button>
            </Link>

            {/* Settings menu moved to home/dashboard */}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">My Trips</h1>
            <p className="text-muted-foreground">
              {trips.length} trip{trips.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex gap-2">
            {(['all', 'upcoming', 'past'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl p-12 text-center border"
          >
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground mb-6">
              Start planning your next adventure!
            </p>
            <Link to="/trips/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Plan a Trip
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={index}
                onDelete={() => deleteTrip(trip.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ----------------- Trip Card ----------------- */

function TripCard({
  trip,
  index,
  onDelete,
}: {
  trip: Trip;
  index: number;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const duration =
    differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl overflow-hidden shadow hover:shadow-lg transition"
    >
      <div
        className="aspect-video cursor-pointer"
        onClick={() => navigate(`/trips/${trip.id}`)}
      >
        <img
          src={trip.cover_image || '/placeholder.svg'}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{trip.name}</h3>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(trip.start_date), 'MMM d')}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {duration} days
          </span>

          {trip.total_budget && trip.total_budget > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />${trip.total_budget}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/trips/${trip.id}`)}>
            <Edit2 className="mr-2 h-4 w-4" />
            View
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
}
