/**
 * Trips API Service
 * Abstracts all trip-related database operations
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError, logError, NotFoundError } from '@/lib/errors';
import type { Trip, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface CreateTripInput {
  name: string;
  description?: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  is_public?: boolean;
  total_budget?: number;
}

export interface UpdateTripInput {
  name?: string;
  description?: string;
  cover_image?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  total_budget?: number;
}

export interface TripFilters {
  userId?: string;
  isPublic?: boolean;
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
  offset?: number;
}

class TripsService {
  /**
   * Get all trips with optional filters
   */
  async getTrips(filters: TripFilters = {}): Promise<Trip[]> {
    try {
      let query = supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic);
      }

      if (filters.upcoming) {
        query = query.gte('start_date', new Date().toISOString().split('T')[0]);
      }

      if (filters.past) {
        query = query.lt('end_date', new Date().toISOString().split('T')[0]);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Trip[];
    } catch (error) {
      logError(error, { operation: 'getTrips', filters });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get a single trip by ID
   */
  async getTripById(id: string): Promise<Trip> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Trip');

      return data as Trip;
    } catch (error) {
      logError(error, { operation: 'getTripById', tripId: id });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Create a new trip
   */
  async createTrip(input: CreateTripInput, userId: string): Promise<Trip> {
    try {
      const tripData: TablesInsert<'trips'> = {
        user_id: userId,
        name: input.name,
        description: input.description || null,
        cover_image: input.cover_image || null,
        start_date: input.start_date,
        end_date: input.end_date,
        is_public: input.is_public ?? false,
        total_budget: input.total_budget || 0,
      };

      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create trip');

      return data as Trip;
    } catch (error) {
      logError(error, { operation: 'createTrip', input });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Update an existing trip
   */
  async updateTrip(id: string, input: UpdateTripInput, userId: string): Promise<Trip> {
    try {
      // Verify ownership
      const trip = await this.getTripById(id);
      if (trip.user_id !== userId) {
        throw new Error('Unauthorized: You can only update your own trips');
      }

      const updateData: TablesUpdate<'trips'> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.cover_image !== undefined) updateData.cover_image = input.cover_image;
      if (input.start_date !== undefined) updateData.start_date = input.start_date;
      if (input.end_date !== undefined) updateData.end_date = input.end_date;
      if (input.is_public !== undefined) updateData.is_public = input.is_public;
      if (input.total_budget !== undefined) updateData.total_budget = input.total_budget;

      const { data, error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Trip');

      return data as Trip;
    } catch (error) {
      logError(error, { operation: 'updateTrip', tripId: id, input });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Delete a trip
   */
  async deleteTrip(id: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const trip = await this.getTripById(id);
      if (trip.user_id !== userId) {
        throw new Error('Unauthorized: You can only delete your own trips');
      }

      const { error } = await supabase.from('trips').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      logError(error, { operation: 'deleteTrip', tripId: id });
      throw handleSupabaseError(error);
    }
  }
}

export const tripsService = new TripsService();

