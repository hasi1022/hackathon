
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface UserPreferences {
  id?: string;
  favorite_locations: string[];
  temperature_unit: 'celsius' | 'fahrenheit';
  default_location: string | null;
  notifications_enabled: boolean;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    favorite_locations: [],
    temperature_unit: 'celsius',
    default_location: null,
    notifications_enabled: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_weather_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          id: data.id,
          favorite_locations: Array.isArray(data.favorite_locations) ? data.favorite_locations as string[] : [],
          temperature_unit: (data.temperature_unit === 'celsius' || data.temperature_unit === 'fahrenheit') ? data.temperature_unit : 'celsius',
          default_location: data.default_location,
          notifications_enabled: data.notifications_enabled ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const updatedPreferences = { ...preferences, ...updates };
      
      const { error } = await supabase
        .from('user_weather_preferences')
        .upsert({
          user_id: user.id,
          favorite_locations: updatedPreferences.favorite_locations,
          temperature_unit: updatedPreferences.temperature_unit,
          default_location: updatedPreferences.default_location,
          notifications_enabled: updatedPreferences.notifications_enabled,
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "Preferences updated",
        description: "Your weather preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addFavoriteLocation = async (location: string) => {
    const newFavorites = [...preferences.favorite_locations];
    if (!newFavorites.includes(location)) {
      newFavorites.push(location);
      await updatePreferences({ favorite_locations: newFavorites });
    }
  };

  const removeFavoriteLocation = async (location: string) => {
    const newFavorites = preferences.favorite_locations.filter(loc => loc !== location);
    await updatePreferences({ favorite_locations: newFavorites });
  };

  return {
    preferences,
    loading,
    updatePreferences,
    addFavoriteLocation,
    removeFavoriteLocation,
    fetchPreferences,
  };
};
