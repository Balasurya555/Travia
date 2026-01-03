/**
 * Activities API Service
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError, logError } from '@/lib/errors';
import type { Activity, StopActivity, TablesInsert } from '@/integrations/supabase/types';

export interface ActivityFilters {
  city_id?: string;
  category?: string;
  search?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
}

class ActivitiesService {
  /**
   * Get all activities with optional filters
   */
  async getActivities(filters: ActivityFilters = {}): Promise<Activity[]> {
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .order('rating', { ascending: false });

      if (filters.city_id) {
        query = query.eq('city_id', filters.city_id);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Activity[];
    } catch (error) {
      logError(error, { operation: 'getActivities', filters });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get activities for a stop
   */
  async getStopActivities(stopId: string): Promise<(StopActivity & { activity?: Activity })[]> {
    try {
      const { data: stopActivities, error: stopActivitiesError } = await supabase
        .from('stop_activities')
        .select('*')
        .eq('stop_id', stopId);

      if (stopActivitiesError) throw stopActivitiesError;

      if (!stopActivities || stopActivities.length === 0) {
        return [];
      }

      // Fetch activity details for each stop activity
      const activityIds = stopActivities
        .map((sa) => sa.activity_id)
        .filter((id): id is string => id !== null);

      let activities: Activity[] = [];
      if (activityIds.length > 0) {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .in('id', activityIds);

        if (activitiesError) throw activitiesError;
        activities = (activitiesData || []) as Activity[];
      }

      return stopActivities.map((sa) => ({
        ...sa,
        activity: activities.find((a) => a.id === sa.activity_id),
      })) as (StopActivity & { activity?: Activity })[];
    } catch (error) {
      logError(error, { operation: 'getStopActivities', stopId });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Add an activity to a stop
   */
  async addActivityToStop(
    stopId: string,
    activityId: string,
    customCost?: number
  ): Promise<StopActivity> {
    try {
      const activityData: TablesInsert<'stop_activities'> = {
        stop_id: stopId,
        activity_id: activityId,
        custom_cost: customCost || 0,
      };

      const { data, error } = await supabase
        .from('stop_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to add activity to stop');

      return data as StopActivity;
    } catch (error) {
      logError(error, { operation: 'addActivityToStop', stopId, activityId });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Remove an activity from a stop
   */
  async removeActivityFromStop(stopActivityId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('stop_activities')
        .delete()
        .eq('id', stopActivityId);

      if (error) throw error;
    } catch (error) {
      logError(error, { operation: 'removeActivityFromStop', stopActivityId });
      throw handleSupabaseError(error);
    }
  }
}

export const activitiesService = new ActivitiesService();

