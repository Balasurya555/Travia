/**
 * Trip Stops API Service
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError, logError, NotFoundError } from '@/lib/errors';
import type { TripStop, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface CreateStopInput {
  trip_id: string;
  city_id?: string;
  city_name: string;
  country?: string;
  arrival_date: string;
  departure_date: string;
  accommodation_cost?: number;
  transport_cost?: number;
  notes?: string;
  order_index?: number;
}

export interface UpdateStopInput {
  city_id?: string;
  city_name?: string;
  country?: string;
  arrival_date?: string;
  departure_date?: string;
  accommodation_cost?: number;
  transport_cost?: number;
  notes?: string;
  order_index?: number;
}

class TripStopsService {
  /**
   * Get all stops for a trip
   */
  async getStopsByTripId(tripId: string): Promise<TripStop[]> {
    try {
      const { data, error } = await supabase
        .from('trip_stops')
        .select('*')
        .eq('trip_id', tripId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as TripStop[];
    } catch (error) {
      logError(error, { operation: 'getStopsByTripId', tripId });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get a single stop by ID
   */
  async getStopById(id: string): Promise<TripStop> {
    try {
      const { data, error } = await supabase
        .from('trip_stops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Trip stop');

      return data as TripStop;
    } catch (error) {
      logError(error, { operation: 'getStopById', stopId: id });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Create a new stop
   */
  async createStop(input: CreateStopInput): Promise<TripStop> {
    try {
      const stopData: TablesInsert<'trip_stops'> = {
        trip_id: input.trip_id,
        city_id: input.city_id || null,
        city_name: input.city_name,
        country: input.country || null,
        arrival_date: input.arrival_date,
        departure_date: input.departure_date,
        accommodation_cost: input.accommodation_cost || 0,
        transport_cost: input.transport_cost || 0,
        notes: input.notes || null,
        order_index: input.order_index || 0,
      };

      const { data, error } = await supabase
        .from('trip_stops')
        .insert(stopData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create stop');

      return data as TripStop;
    } catch (error) {
      logError(error, { operation: 'createStop', input });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Update a stop
   */
  async updateStop(id: string, input: UpdateStopInput): Promise<TripStop> {
    try {
      const updateData: TablesUpdate<'trip_stops'> = {};
      if (input.city_id !== undefined) updateData.city_id = input.city_id;
      if (input.city_name !== undefined) updateData.city_name = input.city_name;
      if (input.country !== undefined) updateData.country = input.country;
      if (input.arrival_date !== undefined) updateData.arrival_date = input.arrival_date;
      if (input.departure_date !== undefined) updateData.departure_date = input.departure_date;
      if (input.accommodation_cost !== undefined) updateData.accommodation_cost = input.accommodation_cost;
      if (input.transport_cost !== undefined) updateData.transport_cost = input.transport_cost;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.order_index !== undefined) updateData.order_index = input.order_index;

      const { data, error } = await supabase
        .from('trip_stops')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Trip stop');

      return data as TripStop;
    } catch (error) {
      logError(error, { operation: 'updateStop', stopId: id, input });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Delete a stop
   */
  async deleteStop(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('trip_stops').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      logError(error, { operation: 'deleteStop', stopId: id });
      throw handleSupabaseError(error);
    }
  }
}

export const tripStopsService = new TripStopsService();

