import { useEffect, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import { Loader2, CalendarDays } from 'lucide-react';

type TripLite = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

/* ---------- Helpers ---------- */

const isoDate = (d: Date) => d.toISOString().split('T')[0];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/* ---------- Component ---------- */

export default function TripCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [trips, setTrips] = useState<TripLite[]>([]);
  const [month, setMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWide, setIsWide] = useState(false);

  /* ---------- Responsive months ---------- */
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 900);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ---------- Load trips ---------- */
  useEffect(() => {
    if (!user) return;

    let mounted = true;
    const loadTrips = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('trips')
        .select('id, name, start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (!mounted) return;

      setLoading(false);

      if (error) {
        console.error(error);
        setError('Failed to load trips');
        return;
      }

      setTrips((data || []) as TripLite[]);
    };

    loadTrips();
    return () => {
      mounted = false;
    };
  }, [user]);

  /* ---------- Date → trip map ---------- */
  const dateTripMap = useMemo(() => {
    const map: Record<string, string[]> = {};

    trips.forEach((trip) => {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = isoDate(d);
        map[key] ??= [];
        map[key].push(trip.name);
      }
    });

    return map;
  }, [trips]);

  const bookedDayCount = Object.keys(dateTripMap).length;

  const isBooked = (date: Date) => Boolean(dateTripMap[isoDate(date)]);

  const onDayClick = (date?: Date) => {
    if (!date) return;

    const tripsOnDay = dateTripMap[isoDate(date)];
    toast({
      title: tripsOnDay ? 'Trips on this day' : 'No trips',
      description: tripsOnDay?.join(', ') ?? 'No trips scheduled',
    });
  };

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" />
              Trip Calendar
            </h1>
            <p className="text-muted-foreground">
              Visual overview of all your trips
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
              Today
            </Button>
            <span className="text-muted-foreground">
              Booked days: <span className="font-semibold">{bookedDayCount}</span>
            </span>
          </div>
        </div>

        {/* Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-semibold mb-4">Calendar View</h3>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <DayPicker
                  month={month}
                  onMonthChange={setMonth}
                  numberOfMonths={isWide ? 2 : 1}
                  modifiers={{ booked: isBooked }}
                  modifiersClassNames={{ booked: 'bg-primary text-primary-foreground rounded-md' }}
                  onDayClick={onDayClick}
                  classNames={{ months: 'flex gap-4 flex-wrap' }}
                />
              )}

              <div className="mt-4 text-sm flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-primary" />
                <span className="text-muted-foreground">
                  Dates with active trips
                </span>
              </div>

              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>

          {/* Trip list */}
          <div className="md:col-span-2 space-y-4">
            {trips.length === 0 && !loading ? (
              <div className="bg-card rounded-xl p-6 border text-muted-foreground">
                You don’t have any trips yet. Create one to see it on the calendar.
              </div>
            ) : (
              trips.map((trip) => {
                const days =
                  Math.round(
                    (new Date(trip.end_date).getTime() -
                      new Date(trip.start_date).getTime()) /
                      MS_PER_DAY
                  ) + 1;

                return (
                  <div
                    key={trip.id}
                    className="bg-card rounded-xl p-5 border hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{trip.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(trip.start_date).toLocaleDateString()} —{' '}
                          {new Date(trip.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {days} days
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
