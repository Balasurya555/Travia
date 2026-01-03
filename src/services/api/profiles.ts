/**
 * Profiles API Service
 */

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError, logError, NotFoundError } from '@/lib/errors';
import type { Profile, TablesUpdate } from '@/integrations/supabase/types';

export interface UpdateProfileInput {
  full_name?: string;
  avatar_url?: string;
  preferred_currency?: string;
}

class ProfilesService {
  /**
   * Get profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return (data as Profile) || null;
    } catch (error) {
      logError(error, { operation: 'getProfileByUserId', userId });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    try {
      const updateData: TablesUpdate<'profiles'> = {};
      if (input.full_name !== undefined) updateData.full_name = input.full_name;
      if (input.avatar_url !== undefined) updateData.avatar_url = input.avatar_url;
      if (input.preferred_currency !== undefined) updateData.preferred_currency = input.preferred_currency;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Profile');

      return data as Profile;
    } catch (error) {
      logError(error, { operation: 'updateProfile', userId, input });
      throw handleSupabaseError(error);
    }
  }
}

export const profilesService = new ProfilesService();

