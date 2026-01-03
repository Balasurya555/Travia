import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass, ArrowLeft, Calendar, ImageIcon, Globe, Lock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const tripSchema = z.object({
  name: z.string().min(2, 'Trip name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  start_date: z.date({ required_error: 'Start date is required' }),
  end_date: z.date({ required_error: 'End date is required' }),
  cover_image: z.string().url().optional().or(z.literal('')),
  is_public: z.boolean(),
});

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    cover_image: '',
    is_public: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = tripSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      setErrors({ end_date: 'End date must be after start date' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: user?.id,
          name: formData.name,
          description: formData.description || null,
          start_date: format(formData.start_date!, 'yyyy-MM-dd'),
          end_date: format(formData.end_date!, 'yyyy-MM-dd'),
          cover_image: formData.cover_image || null,
          is_public: formData.is_public,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Trip created successfully!');
      navigate(`/trips/${data.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const coverImages = [
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Compass className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold">Travia</span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Plan a New Trip
          </h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details to start planning your adventure.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Trip Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Trip Name *</Label>
              <Input
                id="name"
                placeholder="Summer in Europe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A 2-week adventure across France, Italy, and Spain..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-12 justify-start text-left font-normal',
                        !formData.start_date && 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.start_date
                        ? format(formData.start_date, 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({ ...formData, start_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-12 justify-start text-left font-normal',
                        !formData.end_date && 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.end_date
                        ? format(formData.end_date, 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      initialFocus
                      disabled={(date) =>
                        formData.start_date ? date < formData.start_date : false
                      }
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.end_date && (
                  <p className="text-sm text-destructive">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-4">
              <Label>Cover Image</Label>
              <div className="grid grid-cols-3 gap-3">
                {coverImages.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setFormData({ ...formData, cover_image: img })}
                    className={cn(
                      'aspect-video rounded-lg overflow-hidden ring-2 transition-all',
                      formData.cover_image === img
                        ? 'ring-primary ring-offset-2'
                        : 'ring-transparent hover:ring-border'
                    )}
                  >
                    <img src={img} alt="Cover option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Or paste a custom image URL"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                {formData.is_public ? (
                  <Globe className="h-5 w-5 text-ocean" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {formData.is_public ? 'Public Trip' : 'Private Trip'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_public
                      ? 'Anyone can view this trip'
                      : 'Only you can view this trip'}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_public: checked })
                }
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="hero" size="lg" className="flex-1" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Create Trip'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
