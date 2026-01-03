import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass, Search, MapPin, DollarSign, Star, TrendingUp,
  LogOut, User, Filter, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { City, Activity } from '@/types/database';
import Map, { MapMarker } from '@/components/Map';
import CitySearch from '@/components/CitySearch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Explore() {
  const { user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(
    searchParams.get('city')
  );
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [citiesRes, activitiesRes] = await Promise.all([
        supabase.from('cities').select('*').order('popularity', { ascending: false }),
        supabase.from('activities').select('*').order('rating', { ascending: false }),
      ]);

      if (citiesRes.data) setCities(citiesRes.data as City[]);
      if (activitiesRes.data) setActivities(activitiesRes.data as Activity[]);
      // build map markers from cities
      if (citiesRes.data) {
        const markers = (citiesRes.data as City[])
          .filter((c) => c.latitude && c.longitude)
          .map((c) => ({ id: c.id, name: c.name, lat: Number(c.latitude), lng: Number(c.longitude), popup: `${c.name}, ${c.country}` }));
        setMapMarkers(markers);
        if (markers.length > 0 && !mapCenter) setMapCenter([markers[0].lat, markers[0].lng]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = activities.filter((activity) => {
    const matchesCity = selectedCity ? activity.city_id === selectedCity : true;
    const matchesCategory =
      categoryFilter === 'all' ? true : activity.category === categoryFilter;
    const matchesSearch = activity.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCity && matchesCategory && (selectedCity ? true : matchesSearch);
  });

  const categories = [...new Set(activities.map((a) => a.category).filter(Boolean))];

  const selectedCityData = cities.find((c) => c.id === selectedCity);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Compass className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Discovering destinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <Compass className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold">Travia</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/my-trips">
                  <Button variant="ghost" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    My Trips
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                {/* Settings menu moved to home/dashboard */}
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="hero">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Explore Destinations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing cities and activities around the world.
          </p>
        </motion.div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search cities or activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg rounded-xl"
            />
          </div>
        </div>

        {/* City search + map */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-1">
            <CitySearch
              onSelect={(city) => {
                // center map on chosen city
                setMapCenter([city.lat, city.lon]);
                setMapMarkers((m) => [...m, { id: `${city.lat}_${city.lon}`, name: city.name, lat: city.lat, lng: city.lon, popup: `${city.name}, ${city.country}` }]);
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Map center={mapCenter || [20, 0]} markers={mapMarkers} height="420px" />
          </div>
        </div>

        {/* Selected City View */}
        {selectedCity && selectedCityData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => setSelectedCity(null)}
            >
              ← Back to all cities
            </Button>

            <div className="relative rounded-2xl overflow-hidden mb-8">
              <img
                src={selectedCityData.image_url || '/placeholder.svg'}
                alt={selectedCityData.name}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="font-display text-4xl font-bold text-primary-foreground mb-2">
                  {selectedCityData.name}
                </h2>
                <p className="text-lg text-primary-foreground/80 mb-4">
                  {selectedCityData.country}
                </p>
                {selectedCityData.description && (
                  <p className="text-primary-foreground/70 max-w-2xl">
                    {selectedCityData.description}
                  </p>
                )}
              </div>
            </div>

            {/* City Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-xl p-4 text-center shadow-card">
                <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Cost Index</p>
                <p className="font-display text-xl font-bold">{selectedCityData.cost_index}/100</p>
              </div>
              <div className="bg-card rounded-xl p-4 text-center shadow-card">
                <TrendingUp className="h-6 w-6 text-ocean mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Popularity</p>
                <p className="font-display text-xl font-bold">{selectedCityData.popularity}/100</p>
              </div>
              <div className="bg-card rounded-xl p-4 text-center shadow-card">
                <MapPin className="h-6 w-6 text-sage mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Activities</p>
                <p className="font-display text-xl font-bold">
                  {filteredActivities.length}
                </p>
              </div>
              <div className="bg-card rounded-xl p-4 text-center shadow-card">
                <Star className="h-6 w-6 text-sunset mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="font-display text-xl font-bold">
                  {filteredActivities.length > 0
                    ? (
                        filteredActivities.reduce((acc, a) => acc + Number(a.rating), 0) /
                        filteredActivities.length
                      ).toFixed(1)
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Activities Filter */}
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat!}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activities Grid */}
            <h3 className="font-display text-2xl font-bold mb-6">
              Things to Do in {selectedCityData.name}
            </h3>
            {filteredActivities.length === 0 ? (
              <p className="text-muted-foreground">No activities found for this city.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map((activity, index) => (
                  <ActivityCard key={activity.id} activity={activity} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Cities Grid */}
        {!selectedCity && (
          <>
            <h2 className="font-display text-2xl font-bold mb-6">Popular Cities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCities.map((city, index) => (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer shadow-card hover:shadow-medium transition-all duration-300"
                    onClick={() => setSelectedCity(city.id)}
                  >
                    <img
                      src={city.image_url || '/placeholder.svg'}
                      alt={city.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {city.popularity}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-display text-xl font-bold text-primary-foreground mb-1">
                        {city.name}
                      </h3>
                      <p className="text-primary-foreground/80 text-sm mb-2">{city.country}</p>
                      <div className="flex items-center gap-3 text-xs text-primary-foreground/70">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {city.cost_index}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-medium transition-all duration-300 group"
    >
      {activity.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={activity.image_url}
            alt={activity.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {activity.category && (
            <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
              {activity.category}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3 text-sunset" fill="currentColor" />
            {Number(activity.rating).toFixed(1)}
          </span>
        </div>
        <h4 className="font-display text-lg font-semibold mb-2">{activity.name}</h4>
        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {activity.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{Number(activity.duration_hours)}h</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>{Number(activity.estimated_cost) === 0 ? 'Free' : `$${activity.estimated_cost}`}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
