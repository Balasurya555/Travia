/**
 * Cities API Service
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError, logError } from '@/lib/errors';
import type { City } from '@/types/database';

export interface CityFilters {
  country?: string;
  search?: string;
  minPopularity?: number;
  limit?: number;
  offset?: number;
}

class CitiesService {
  /**
   * Get all cities with optional filters
   */
  async getCities(filters: CityFilters = {}): Promise<City[]> {
    try {
      let query = supabase
        .from('cities')
        .select('*')
        .order('popularity', { ascending: false });

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,country.ilike.%${filters.search}%`
        );
      }

      if (filters.minPopularity !== undefined) {
        query = query.gte('popularity', filters.minPopularity);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as City[];
    } catch (error) {
      logError(error, { operation: 'getCities', filters });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get a single city by ID
   */
  async getCityById(id: string): Promise<City> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('City not found');

      return data as City;
    } catch (error) {
      logError(error, { operation: 'getCityById', cityId: id });
      throw handleSupabaseError(error);
    }
  }
}

export const citiesService = new CitiesService();

