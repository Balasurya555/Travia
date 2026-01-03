# 🔄 Refactoring Guide
## How to Migrate Components to Use API Service Layer

This guide shows how to refactor existing components to use the new API service layer.

---

## 📋 Migration Pattern

### Before (Direct Supabase Call)

```typescript
// ❌ OLD WAY - Direct Supabase call in component
import { supabase } from '@/integrations/supabase/client';

const MyComponent = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user?.id);
        
        if (error) throw error;
        setTrips(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, [user]);

  // ... rest of component
};
```

### After (Using Service Layer)

```typescript
// ✅ NEW WAY - Using service layer with React Query
import { useQuery } from '@tanstack/react-query';
import { tripsService } from '@/services/api';
import { handleSupabaseError } from '@/lib/errors';
import { toast } from 'sonner';

const MyComponent = () => {
  const { user } = useAuth();
  
  const { data: trips = [], isLoading, error } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: () => tripsService.getTrips({ userId: user?.id }),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      const appError = handleSupabaseError(error);
      toast.error(appError.message);
    }
  }, [error]);

  // ... rest of component
};
```

---

## 🔧 Step-by-Step Migration

### Step 1: Import Services

```typescript
import { tripsService, citiesService, activitiesService } from '@/services/api';
import { handleSupabaseError } from '@/lib/errors';
```

### Step 2: Replace Direct Calls

**Trips:**
```typescript
// OLD
const { data } = await supabase.from('trips').select('*').eq('user_id', userId);

// NEW
const trips = await tripsService.getTrips({ userId });
```

**Create Trip:**
```typescript
// OLD
const { data, error } = await supabase
  .from('trips')
  .insert({ user_id: userId, name, ... })
  .select()
  .single();

// NEW
const trip = await tripsService.createTrip({ name, ... }, userId);
```

**Update Trip:**
```typescript
// OLD
const { data, error } = await supabase
  .from('trips')
  .update({ name, ... })
  .eq('id', tripId)
  .select()
  .single();

// NEW
const trip = await tripsService.updateTrip(tripId, { name, ... }, userId);
```

**Delete Trip:**
```typescript
// OLD
const { error } = await supabase.from('trips').delete().eq('id', tripId);

// NEW
await tripsService.deleteTrip(tripId, userId);
```

### Step 3: Use React Query for Data Fetching

```typescript
// Fetching with React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['trips', userId],
  queryFn: () => tripsService.getTrips({ userId }),
  enabled: !!userId,
});

// Mutations with React Query
const mutation = useMutation({
  mutationFn: (input: CreateTripInput) => 
    tripsService.createTrip(input, userId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    toast.success('Trip created!');
  },
  onError: (error) => {
    const appError = handleSupabaseError(error);
    toast.error(appError.message);
  },
});
```

### Step 4: Error Handling

```typescript
try {
  await tripsService.createTrip(input, userId);
} catch (error) {
  const appError = handleSupabaseError(error);
  
  // Handle specific error types
  if (appError instanceof ValidationError) {
    toast.error(`Validation error: ${appError.message}`);
  } else if (appError instanceof AuthenticationError) {
    navigate('/auth');
  } else {
    toast.error(appError.message);
  }
  
  // Log for monitoring
  logError(error, { operation: 'createTrip', userId });
}
```

---

## 📝 Component Examples

### Example 1: Dashboard Component

```typescript
// src/pages/Dashboard.tsx - Refactored
import { useQuery } from '@tanstack/react-query';
import { tripsService, citiesService } from '@/services/api';
import { handleSupabaseError } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch trips
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', user?.id, 'upcoming'],
    queryFn: () => tripsService.getTrips({ 
      userId: user?.id, 
      upcoming: true,
      limit: 3 
    }),
    enabled: !!user,
  });

  // Fetch cities
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['cities', 'popular'],
    queryFn: () => citiesService.getCities({ 
      limit: 6 
    }),
  });

  const loading = tripsLoading || citiesLoading;

  // ... rest of component
}
```

### Example 2: Create Trip Component

```typescript
// src/pages/CreateTrip.tsx - Refactored
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tripsService } from '@/services/api';
import { handleSupabaseError } from '@/lib/errors';
import { toast } from 'sonner';

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateTripInput) => 
      tripsService.createTrip(input, user!.id),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip created successfully!');
      navigate(`/trips/${trip.id}`);
    },
    onError: (error) => {
      const appError = handleSupabaseError(error);
      toast.error(appError.message);
    },
  });

  const handleSubmit = async (formData: CreateTripInput) => {
    mutation.mutate(formData);
  };

  // ... rest of component
}
```

---

## 🎯 Benefits of Migration

1. **Type Safety** - All operations are fully typed
2. **Error Handling** - Consistent error handling across the app
3. **Testing** - Easy to mock services for testing
4. **Maintainability** - Single source of truth for API calls
5. **Performance** - React Query caching and deduplication
6. **Consistency** - Same patterns everywhere

---

## ⚠️ Important Notes

1. **Always use `handleSupabaseError`** - Converts Supabase errors to AppError
2. **Use React Query** - For data fetching and caching
3. **Invalidate queries** - After mutations to refresh data
4. **Handle loading states** - Use `isLoading` from React Query
5. **Error boundaries** - Consider adding for component-level errors

---

## 📚 Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Error Handling Best Practices](https://kentcdodds.com/blog/get-a-catch-block-error-message)

