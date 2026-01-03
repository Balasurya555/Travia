import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass, ArrowLeft, Calendar, MapPin, DollarSign, Plus,
  Clock, ChevronDown, ChevronUp, Trash2, Share2, Globe, Lock, Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trip, TripStop, StopActivity, City, Activity } from '@/types/database';
import { format, differenceInDays, eachDayOfInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface StopWithActivities extends TripStop {
  activities: (StopActivity & { activity?: Activity })[];
}

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<StopWithActivities[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [expandedStops, setExpandedStops] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      fetchTripData();
    }
  }, [id]);

  const fetchTripData = async () => {
    try {
      const [tripRes, stopsRes, citiesRes, activitiesRes] = await Promise.all([
        supabase.from('trips').select('*').eq('id', id).single(),
        supabase
          .from('trip_stops')
          .select('*')
          .eq('trip_id', id)
          .order('order_index', { ascending: true }),
        supabase.from('cities').select('*'),
        supabase.from('activities').select('*'),
      ]);

      if (tripRes.error) throw tripRes.error;
      setTrip(tripRes.data as Trip);
      setCities(citiesRes.data as City[] || []);
      setActivities(activitiesRes.data as Activity[] || []);

      if (stopsRes.data) {
        const stopsWithActivities: StopWithActivities[] = await Promise.all(
          (stopsRes.data as TripStop[]).map(async (stop) => {
            const { data: stopActivities } = await supabase
              .from('stop_activities')
              .select('*')
              .eq('stop_id', stop.id);

            const activitiesWithDetails = (stopActivities || []).map((sa) => ({
              ...sa,
              activity: (activitiesRes.data as Activity[] || []).find((a) => a.id === sa.activity_id),
            }));

            return {
              ...stop,
              activities: activitiesWithDetails as (StopActivity & { activity?: Activity })[],
            };
          })
        );
        setStops(stopsWithActivities);
        setExpandedStops(new Set(stopsWithActivities.map((s) => s.id)));
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast.error('Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = useMemo(() => {
    let total = 0;
    stops.forEach((stop) => {
      total += Number(stop.accommodation_cost) || 0;
      total += Number(stop.transport_cost) || 0;
      stop.activities.forEach((sa) => {
        total += Number(sa.custom_cost) || Number(sa.activity?.estimated_cost) || 0;
      });
    });
    return total;
  }, [stops]);

  const tripDuration = trip
    ? differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1
    : 0;

  const toggleStop = (stopId: string) => {
    setExpandedStops((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) {
        next.delete(stopId);
      } else {
        next.add(stopId);
      }
      return next;
    });
  };

  const deleteStop = async (stopId: string) => {
    try {
      const { error } = await supabase.from('trip_stops').delete().eq('id', stopId);
      if (error) throw error;
      setStops(stops.filter((s) => s.id !== stopId));
      toast.success('Stop removed');
    } catch (error) {
      console.error('Error deleting stop:', error);
      toast.error('Failed to remove stop');
    }
  };

  const shareTrip = async () => {
    const url = `${window.location.origin}/trips/${id}/public`;
    if (navigator.share) {
      await navigator.share({ title: trip?.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Compass className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Trip not found</p>
          <Link to="/my-trips">
            <Button variant="outline">Back to My Trips</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === trip.user_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80">
        <img
          src={trip.cover_image || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200'}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/40 to-transparent" />
        
        <nav className="absolute top-0 left-0 right-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Button variant="glass" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <Button variant="glass" size="icon" onClick={shareTrip}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Link to={`/trips/${id}/edit`}>
                    <Button variant="glass" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-2">
              {trip.is_public ? (
                <span className="bg-ocean/90 text-ocean-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Public
                </span>
              ) : (
                <span className="bg-card/90 text-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              {trip.name}
            </h1>
            {trip.description && (
              <p className="text-primary-foreground/80 max-w-2xl">{trip.description}</p>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 -mt-12 relative z-10">
          <div className="bg-card rounded-xl p-4 shadow-card">
            <Calendar className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-display text-lg font-bold">{tripDuration} days</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <MapPin className="h-5 w-5 text-ocean mb-2" />
            <p className="text-sm text-muted-foreground">Stops</p>
            <p className="font-display text-lg font-bold">{stops.length} cities</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <DollarSign className="h-5 w-5 text-sage mb-2" />
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="font-display text-lg font-bold">${totalBudget.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <Clock className="h-5 w-5 text-sunset mb-2" />
            <p className="text-sm text-muted-foreground">Dates</p>
            <p className="font-display text-lg font-bold">
              {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'd')}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Itinerary */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">Itinerary</h2>
              {isOwner && (
                <AddStopDialog
                  open={addStopOpen}
                  onOpenChange={setAddStopOpen}
                  tripId={trip.id}
                  cities={cities}
                  tripStartDate={trip.start_date}
                  tripEndDate={trip.end_date}
                  onStopAdded={fetchTripData}
                />
              )}
            </div>

            {stops.length === 0 ? (
              <div className="bg-card rounded-2xl p-12 text-center border border-border">
                <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">No stops yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add your first destination to start building your itinerary.
                </p>
                {isOwner && (
                  <Button variant="hero" onClick={() => setAddStopOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add First Stop
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {stops.map((stop, index) => (
                  <StopCard
                    key={stop.id}
                    stop={stop}
                    index={index}
                    expanded={expandedStops.has(stop.id)}
                    onToggle={() => toggleStop(stop.id)}
                    onDelete={() => deleteStop(stop.id)}
                    isOwner={isOwner}
                    activities={activities}
                    onActivityAdded={fetchTripData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Budget Breakdown */}
          <div className="lg:col-span-1">
            <h2 className="font-display text-2xl font-bold mb-6">Budget Breakdown</h2>
            <BudgetBreakdown stops={stops} totalBudget={totalBudget} />
          </div>
        </div>
      </main>
    </div>
  );
}

function AddStopDialog({
  open,
  onOpenChange,
  tripId,
  cities,
  tripStartDate,
  tripEndDate,
  onStopAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  cities: City[];
  tripStartDate: string;
  tripEndDate: string;
  onStopAdded: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    city_id: '',
    city_name: '',
    country: '',
    arrival_date: undefined as Date | undefined,
    departure_date: undefined as Date | undefined,
    accommodation_cost: 0,
    transport_cost: 0,
  });

  const handleCitySelect = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId);
    if (city) {
      setFormData({
        ...formData,
        city_id: cityId,
        city_name: city.name,
        country: city.country,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.city_name || !formData.arrival_date || !formData.departure_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('trip_stops').insert({
        trip_id: tripId,
        city_id: formData.city_id || null,
        city_name: formData.city_name,
        country: formData.country,
        arrival_date: format(formData.arrival_date, 'yyyy-MM-dd'),
        departure_date: format(formData.departure_date, 'yyyy-MM-dd'),
        accommodation_cost: formData.accommodation_cost,
        transport_cost: formData.transport_cost,
      });

      if (error) throw error;
      toast.success('Stop added!');
      onStopAdded();
      onOpenChange(false);
      setFormData({
        city_id: '',
        city_name: '',
        country: '',
        arrival_date: undefined,
        departure_date: undefined,
        accommodation_cost: 0,
        transport_cost: 0,
      });
    } catch (error) {
      console.error('Error adding stop:', error);
      toast.error('Failed to add stop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="mr-2 h-4 w-4" /> Add Stop
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Stop</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Select value={formData.city_id} onValueChange={handleCitySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!formData.city_id && (
            <>
              <div className="space-y-2">
                <Label>City Name *</Label>
                <Input
                  value={formData.city_name}
                  onChange={(e) =>
                    setFormData({ ...formData, city_name: e.target.value })
                  }
                  placeholder="Enter city name"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="Enter country"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arrival Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.arrival_date && 'text-muted-foreground'
                    )}
                  >
                    {formData.arrival_date
                      ? format(formData.arrival_date, 'MMM d')
                      : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.arrival_date}
                    onSelect={(date) =>
                      setFormData({ ...formData, arrival_date: date })
                    }
                    disabled={(date) =>
                      date < parseISO(tripStartDate) || date > parseISO(tripEndDate)
                    }
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Departure Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.departure_date && 'text-muted-foreground'
                    )}
                  >
                    {formData.departure_date
                      ? format(formData.departure_date, 'MMM d')
                      : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.departure_date}
                    onSelect={(date) =>
                      setFormData({ ...formData, departure_date: date })
                    }
                    disabled={(date) =>
                      date < (formData.arrival_date || parseISO(tripStartDate)) ||
                      date > parseISO(tripEndDate)
                    }
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Accommodation ($)</Label>
              <Input
                type="number"
                value={formData.accommodation_cost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accommodation_cost: Number(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Transport ($)</Label>
              <Input
                type="number"
                value={formData.transport_cost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transport_cost: Number(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <Button
            variant="hero"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Stop'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StopCard({
  stop,
  index,
  expanded,
  onToggle,
  onDelete,
  isOwner,
  activities,
  onActivityAdded,
}: {
  stop: StopWithActivities;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isOwner: boolean;
  activities: Activity[];
  onActivityAdded: () => void;
}) {
  const duration =
    differenceInDays(new Date(stop.departure_date), new Date(stop.arrival_date)) + 1;
  const stopCost =
    Number(stop.accommodation_cost) +
    Number(stop.transport_cost) +
    stop.activities.reduce(
      (acc, sa) => acc + (Number(sa.custom_cost) || Number(sa.activity?.estimated_cost) || 0),
      0
    );

  const cityActivities = activities.filter((a) => a.city_id === stop.city_id);

  const addActivity = async (activityId: string) => {
    try {
      const activity = activities.find((a) => a.id === activityId);
      const { error } = await supabase.from('stop_activities').insert({
        stop_id: stop.id,
        activity_id: activityId,
        custom_cost: activity?.estimated_cost || 0,
      });

      if (error) throw error;
      toast.success('Activity added!');
      onActivityAdded();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    }
  };

  const removeActivity = async (activityId: string) => {
    try {
      const { error } = await supabase.from('stop_activities').delete().eq('id', activityId);
      if (error) throw error;
      onActivityAdded();
    } catch (error) {
      console.error('Error removing activity:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card rounded-xl shadow-card overflow-hidden"
    >
      <div
        className="p-5 cursor-pointer flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-sunset flex items-center justify-center text-primary-foreground font-bold">
            {index + 1}
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">{stop.city_name}</h3>
            <p className="text-sm text-muted-foreground">
              {stop.country} • {format(new Date(stop.arrival_date), 'MMM d')} -{' '}
              {format(new Date(stop.departure_date), 'MMM d')} ({duration} day
              {duration !== 1 ? 's' : ''})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">${stopCost}</span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {/* Costs */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Accommodation</p>
              <p className="font-medium">${stop.accommodation_cost}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Transport</p>
              <p className="font-medium">${stop.transport_cost}</p>
            </div>
          </div>

          {/* Activities */}
          <div className="mb-4">
            <h4 className="font-medium mb-3">Activities ({stop.activities.length})</h4>
            {stop.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities added yet.</p>
            ) : (
              <div className="space-y-2">
                {stop.activities.map((sa) => (
                  <div
                    key={sa.id}
                    className="flex items-center justify-between bg-muted/30 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {sa.activity?.name || sa.custom_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${Number(sa.custom_cost) || Number(sa.activity?.estimated_cost) || 0}
                      </p>
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeActivity(sa.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Activity */}
          {isOwner && cityActivities.length > 0 && (
            <div className="mb-4">
              <Select onValueChange={addActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="Add activity..." />
                </SelectTrigger>
                <SelectContent>
                  {cityActivities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name} - ${activity.estimated_cost}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Remove Stop
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function BudgetBreakdown({
  stops,
  totalBudget,
}: {
  stops: StopWithActivities[];
  totalBudget: number;
}) {
  const accommodationTotal = stops.reduce(
    (acc, s) => acc + Number(s.accommodation_cost),
    0
  );
  const transportTotal = stops.reduce((acc, s) => acc + Number(s.transport_cost), 0);
  const activitiesTotal = stops.reduce(
    (acc, s) =>
      acc +
      s.activities.reduce(
        (a, sa) => a + (Number(sa.custom_cost) || Number(sa.activity?.estimated_cost) || 0),
        0
      ),
    0
  );

  const categories = [
    { name: 'Accommodation', amount: accommodationTotal, color: 'bg-ocean' },
    { name: 'Transport', amount: transportTotal, color: 'bg-sage' },
    { name: 'Activities', amount: activitiesTotal, color: 'bg-sunset' },
  ];

  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
        <p className="font-display text-4xl font-bold">${totalBudget.toLocaleString()}</p>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{cat.name}</span>
              <span className="text-sm text-muted-foreground">
                ${cat.amount.toLocaleString()}
              </span>
            </div>
            <Progress
              value={totalBudget > 0 ? (cat.amount / totalBudget) * 100 : 0}
              className="h-2"
            />
          </div>
        ))}
      </div>

      {stops.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium mb-3">Cost per City</h4>
          <div className="space-y-2">
            {stops.map((stop) => {
              const cost =
                Number(stop.accommodation_cost) +
                Number(stop.transport_cost) +
                stop.activities.reduce(
                  (a, sa) =>
                    a + (Number(sa.custom_cost) || Number(sa.activity?.estimated_cost) || 0),
                  0
                );
              return (
                <div key={stop.id} className="flex items-center justify-between text-sm">
                  <span>{stop.city_name}</span>
                  <span className="font-medium">${cost.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
