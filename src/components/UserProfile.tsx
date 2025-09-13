
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Settings, MapPin, Thermometer, Bell, Star, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { preferences, updatePreferences, addFavoriteLocation, removeFavoriteLocation } = useUserPreferences();
  const [profile, setProfile] = useState({ full_name: '', username: '' });
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          username: data.username || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          username: profile.username,
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      addFavoriteLocation(newLocation.trim());
      setNewLocation('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Choose a username"
            />
          </div>

          <Button onClick={updateProfile} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Weather Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Weather Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Temperature Unit</Label>
            <Select
              value={preferences.temperature_unit}
              onValueChange={(value: 'celsius' | 'fahrenheit') => 
                updatePreferences({ temperature_unit: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celsius">Celsius (°C)</SelectItem>
                <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_location">Default Location</Label>
            <Input
              id="default_location"
              value={preferences.default_location || ''}
              onChange={(e) => updatePreferences({ default_location: e.target.value })}
              placeholder="Enter your default city"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </Label>
              <p className="text-sm text-gray-600">Receive weather alerts and updates</p>
            </div>
            <Switch
              checked={preferences.notifications_enabled}
              onCheckedChange={(checked) => updatePreferences({ notifications_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Favorite Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Favorite Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add a favorite location"
              onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
            />
            <Button onClick={handleAddLocation}>Add</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {preferences.favorite_locations.map((location, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-red-100"
                  onClick={() => removeFavoriteLocation(location)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>

          {preferences.favorite_locations.length === 0 && (
            <p className="text-gray-500 text-sm">No favorite locations added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <div className="flex gap-2">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Close
        </Button>
        <Button onClick={handleSignOut} variant="destructive" className="flex-1">
          Sign Out
        </Button>
      </div>
    </div>
  );
};
