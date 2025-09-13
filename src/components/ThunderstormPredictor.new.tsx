import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { useRateLimit } from '@/hooks/useRateLimit';

const SUPABASE_URL = "https://tioxlvekpelevjawtzst.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb3hsdmVrcGVsZXZqYXd0enN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTY1MjMsImV4cCI6MjA2NTQ5MjUyM30.NrpNXmfUrm56zOpJ7Z7x1BXqtXGr4z9oo_Nm6MkmV8c";

// Default location (New York City)
const DEFAULT_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060
};

interface ThunderstormPrediction {
  prediction: number;
  currentConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressureSeaLevel: number;
    precipitationIntensity: number;
  };
}

const ThunderstormPredictor: React.FC = () => {
  const [prediction, setPrediction] = useState<ThunderstormPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();
  const { execute: executeWithRateLimit } = useRateLimit({
    maxAttempts: 3,
    delayMs: 2000,
    maxDelayMs: 10000
  });

  const requestLocation = async (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location access denied. Please enable location services to get accurate predictions.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out.'));
              break;
            default:
              reject(new Error('An unknown error occurred.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  };

  const fetchPrediction = async (useDefaultLocation = false): Promise<void> => {
    try {
      setLoading(true);
      setLocationError(null);

      let coords;
      try {
        if (useDefaultLocation) {
          coords = DEFAULT_LOCATION;
          toast({
            title: "Using Default Location",
            description: "Showing predictions for New York City",
            variant: "default"
          });
        } else {
          const position = await requestLocation();
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      } catch (error) {
        console.error('Location error:', error);
        setLocationError((error as Error).message);
        if (!useDefaultLocation) {
          // Retry with default location
          return fetchPrediction(true);
        }
        throw error;
      }

      const data = await executeWithRateLimit(async () => {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/thunderstorm-prediction?lat=${coords.latitude}&lon=${coords.longitude}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
              'Origin': window.location.origin
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          throw new Error(`Error: ${response.status} - ${errorText}`);
        }

        return response.json();
      });

      setPrediction(data as ThunderstormPrediction);

      if (data.prediction > 0.7) {
        toast({
          title: "⚡ High Thunderstorm Risk!",
          description: "Take necessary precautions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch prediction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, []);

  const handleRefresh = () => {
    fetchPrediction();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading prediction...</CardTitle>
        </CardHeader>
        <CardContent>
          Please wait while we analyze the weather conditions...
        </CardContent>
      </Card>
    );
  }

  if (locationError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Location Error</AlertTitle>
        <AlertDescription>{locationError}</AlertDescription>
        <Button 
          onClick={() => fetchPrediction(true)} 
          variant="outline" 
          className="mt-4"
        >
          Use Default Location
        </Button>
      </Alert>
    );
  }

  if (!prediction) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to get thunderstorm prediction</AlertDescription>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="mt-4"
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  const getRiskLevel = (probability: number): string => {
    if (probability > 0.7) return 'High';
    if (probability > 0.4) return 'Moderate';
    return 'Low';
  };

  const getRiskColor = (probability: number): string => {
    if (probability > 0.7) return 'text-red-600';
    if (probability > 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thunderstorm Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold">
              Risk Level:{' '}
              <span className={getRiskColor(prediction.prediction)}>
                {getRiskLevel(prediction.prediction)}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Probability: {Math.round(prediction.prediction * 100)}%
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Current Conditions:</h3>
            <p>Temperature: {prediction.currentConditions.temperature}°C</p>
            <p>Humidity: {prediction.currentConditions.humidity}%</p>
            <p>Wind Speed: {prediction.currentConditions.windSpeed} m/s</p>
            <p>Pressure: {prediction.currentConditions.pressureSeaLevel} hPa</p>
            <p>Precipitation: {prediction.currentConditions.precipitationIntensity} mm/hr</p>
          </div>

          <Button onClick={handleRefresh}>
            Refresh Prediction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThunderstormPredictor;