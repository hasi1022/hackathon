import React, { useState, useEffect } from 'react';
import { Search, MapPin, Thermometer, Droplets, Wind, Gauge, Eye, Sun, CloudRain, AlertTriangle, User, Star, Palette, Gamepad2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WeatherCard } from '@/components/WeatherCard';
import { ForecastCard } from '@/components/ForecastCard';
import { WeatherBackground } from '@/components/WeatherBackground';
import { ParticleWeather } from '@/components/ParticleWeather';
import { WeatherGlobe } from '@/components/WeatherGlobe';
import { VoiceWeatherSearch } from '@/components/VoiceWeatherSearch';
import { WeatherMoodRecommendations } from '@/components/WeatherMoodRecommendations';
import { WeatherGameification } from '@/components/WeatherGameification';
import { UserProfile } from '@/components/UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toast } from '@/hooks/use-toast';
import ThunderstormPredictor from '@/components/ThunderstormPredictor';
import { useNavigate } from 'react-router-dom';

const API_KEY = '5EQZDJIyPYQJhIuKIgctgnKIwIk11eG7'; // Replace this with your actual OpenWeatherMap API key

interface WeatherData {
  name: string;
  country: string;
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex?: number;
}

interface ForecastData {
  date: string;
  temp: { min: number; max: number };
  condition: string;
  icon: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { preferences, addFavoriteLocation } = useUserPreferences();
  const navigate = useNavigate();
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'globe' | 'game'>('normal');
  const [particleIntensity, setParticleIntensity] = useState(1);

  // Use user preferences for temperature unit
  useEffect(() => {
    if (user && preferences.temperature_unit) {
      setIsCelsius(preferences.temperature_unit === 'celsius');
    }
  }, [user, preferences.temperature_unit]);

  const convertTemp = (temp: number) => {
    return isCelsius ? temp : (temp * 9/5) + 32;
  };

  const formatTemp = (temp: number) => {
    return `${Math.round(convertTemp(temp))}°${isCelsius ? 'C' : 'F'}`;
  };

  const getWeatherTip = (condition: string, temp: number) => {
    if (!condition) return "Weather condition unavailable";
    
    const tempC = isCelsius ? temp : (temp - 32) * 5/9;
    
    if (condition.toLowerCase().includes('rain')) {
      return "🌧️ Rainy weather: Carry an umbrella and wear waterproof clothing.";
    } else if (condition.toLowerCase().includes('snow')) {
      return "❄️ Snowy conditions: Drive carefully and dress warmly in layers.";
    } else if (condition.includes('thunder')) {
      return "⛈️ Thunderstorms: Stay indoors and avoid outdoor activities.";
    } else if (tempC > 30) {
      return "🌡️ Hot weather: Stay hydrated and seek shade during peak hours.";
    } else if (tempC < 0) {
      return "🧥 Freezing cold: Bundle up and protect exposed skin.";
    } else if (condition.includes('clear') || condition.includes('sun')) {
      return "☀️ Beautiful sunny day: Perfect for outdoor activities!";
    } else if (condition.includes('cloud')) {
      return "☁️ Cloudy skies: Comfortable weather for most activities.";
    }
    return "🌤️ Check conditions throughout the day and dress accordingly.";
  };

  const getSevereWeatherAlert = (weatherData: WeatherData) => {
    if (!weatherData) return null;
    
    const { condition, windSpeed, temp } = weatherData;
    const tempC = isCelsius ? temp : (temp - 32) * 5/9;
    
    if (condition.toLowerCase().includes('thunder') || condition.toLowerCase().includes('storm')) {
      return "⚠️ Storm Warning: Heavy rain and strong winds expected. Stay indoors and avoid flooded areas.";
    } else if (windSpeed > 40) {
      return "💨 High Wind Alert: Winds above 40 km/h. Secure loose objects and drive carefully.";
    } else if (tempC > 35) {
      return "🌡️ Heat Warning: Extreme heat conditions. Stay hydrated and avoid prolonged sun exposure.";
    } else if (tempC < -10) {
      return "🧊 Cold Warning: Extreme cold conditions. Limit outdoor exposure and dress appropriately.";
    }
    return null;
  };

  const fetchWeatherData = async (city: string = '') => {
    setLoading(true);
    setError('');
    
    try {
      let weatherResponse;
      let forecastResponse;
      
      // If no city provided and user has default location, use that
      if (!city && user && preferences.default_location) {
        city = preferences.default_location;
      }
      
      if (city) {
        weatherResponse = await fetch(
          `https://api.tomorrow.io/v4/weather/realtime?location=${city}&apikey=${API_KEY}&units=metric&fields=temperature,windSpeed,weatherCode,precipitationProbability`
        );

        // Forecast (daily/hourly)
        forecastResponse = await fetch(
          `https://api.tomorrow.io/v4/weather/forecast?location=${city}&apikey=${API_KEY}&units=metric&fields=temperature,windSpeed,weatherCode,precipitationProbability`
        );
      } else {
        // Try to get user location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        
        // Function to handle fetch with retry
        const fetchWithRetry = async (url: string, retries = 3, delay = 2000) => {
          for (let i = 0; i < retries; i++) {
            try {
              const response = await fetch(url);
              if (response.ok) return response;
              if (response.status === 429) {
                // Rate limit hit, wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
              }
              throw new Error(`HTTP error! status: ${response.status}`);
            } catch (error) {
              if (i === retries - 1) throw error;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          throw new Error('Max retries reached');
        };

        weatherResponse = await fetchWithRetry(
          `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${API_KEY}&units=metric`
        );

        // Forecast weather
        forecastResponse = await fetchWithRetry(
          `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&apikey=${API_KEY}&units=metric&fields=precipitationProbability,weatherCode,temperature,windSpeed`
        );
      }

      if (!weatherResponse.ok || !forecastResponse.ok) {
        throw new Error('Weather data not found');
      }

      // const weather = await weatherResponse.json();
      // const forecast = await forecastResponse.json();

      // const weatherData: WeatherData = {
      //   name: weather.name,
      //   country: weather.sys.country,
      //   temp: weather.main.temp,
      //   feelsLike: weather.main.feels_like,
      //   condition: weather.weather[0].main,
      //   description: weather.weather[0].description,
      //   icon: weather.weather[0].icon,
      //   humidity: weather.main.humidity,
      //   windSpeed: weather.wind.speed * 3.6, // Convert m/s to km/h
      //   pressure: weather.main.pressure,
      //   visibility: weather.visibility / 1000, // Convert to km
      // };

      // // Process 5-day forecast (take one entry per day at 12:00)
      // const dailyForecasts: ForecastData[] = [];
      // const processedDates = new Set();

      // forecast.list.forEach((item: any) => {
      //   const date = new Date(item.dt * 1000);
      //   const dateStr = date.toDateString();

      //   if (!processedDates.has(dateStr) && dailyForecasts.length < 5) {
      //     processedDates.add(dateStr);
      //     dailyForecasts.push({
      //       date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      //       temp: {
      //         min: Math.min(...forecast.list
      //           .filter((f: any) => new Date(f.dt * 1000).toDateString() === dateStr)
      //           .map((f: any) => f.main.temp_min)),
      //         max: Math.max(...forecast.list
      //           .filter((f: any) => new Date(f.dt * 1000).toDateString() === dateStr)
      //           .map((f: any) => f.main.temp_max))
      //       },
      //       condition: item.weather[0].main,
      //       icon: item.weather[0].icon,
      //       description: item.weather[0].description,
      //       humidity: item.main.humidity,
      //       windSpeed: item.wind.speed * 3.6
      //     });
      //   }
      // });

      // setWeatherData(weatherData);
      // setForecastData(dailyForecasts);
      // setLastUpdated(new Date());

      const weather = await weatherResponse.json();
      const forecast = await forecastResponse.json();

      // --- Current weather mapping ---
      const current = weather.data.values;

      const weatherData: WeatherData = {
        name: weather.location?.name || "Unknown",
        country: "", // Tomorrow.io does not directly return country, optional
        temp: current.temperature,
        feelsLike: current.temperatureApparent || current.temperature, // if available
        condition: current.weatherCode?.toString() || "N/A", // map code → description if you want
        description: "See weatherCode mapping", // you’ll need a map of weatherCode → description
        icon: current.weatherCode?.toString(), // or map to icons yourself
        humidity: current.humidity,
        windSpeed: current.windSpeed * 3.6, // Tomorrow.io is m/s → convert to km/h
        pressure: current.pressureSeaLevel,
        visibility: (current.visibility || 0) / 1000 // meters → km
      };

      // --- Forecast mapping (5-day) ---
      const dailyForecasts: ForecastData[] = forecast.timelines.daily
        .slice(0, 5)
        .map((day: any) => ({
          date: new Date(day.time).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          }),
          temp: {
            min: day.values.temperatureMin,
            max: day.values.temperatureMax
          },
          condition: day.values.weatherCode?.toString(),
          icon: day.values.weatherCode?.toString(), // again, map yourself
          description: "See weatherCode mapping",
          humidity: day.values.humidityAvg,
          windSpeed: day.values.windSpeedAvg * 3.6
        }));

      setWeatherData(weatherData);
      setForecastData(dailyForecasts);
      setLastUpdated(new Date());


      // Cache the data
      localStorage.setItem('weatherData', JSON.stringify(weatherData));
      localStorage.setItem('forecastData', JSON.stringify(dailyForecasts));
      localStorage.setItem('lastUpdated', new Date().toISOString());

      toast({
        title: "Weather updated",
        description: `Weather data for ${weatherData.name} loaded successfully.`,
      });

    } catch (err) {
      console.error('Error fetching weather:', err);
      setError(city ? 'City not found. Please check the spelling and try again.' : 'Location access denied. Showing cached data or default location.');

      // Try to load cached data
      const cachedWeather = localStorage.getItem('weatherData');
      const cachedForecast = localStorage.getItem('forecastData');

      if (cachedWeather && cachedForecast) {
        setWeatherData(JSON.parse(cachedWeather));
        setForecastData(JSON.parse(cachedForecast));
        setLastUpdated(new Date(localStorage.getItem('lastUpdated') || ''));
        toast({
          title: "Showing cached data",
          description: "Unable to fetch new data. Showing last known weather information.",
        });
      } else {
        // Fallback to default city
        await fetchWeatherData('New York');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeatherData(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleVoiceSearch = (query: string) => {
    fetchWeatherData(query);
  };

  const handleAddToFavorites = () => {
    if (user && weatherData) {
      addFavoriteLocation(`${weatherData.name}, ${weatherData.country}`);
    } else {
      navigate('/auth');
    }
  };

  const handleFavoriteLocationClick = (location: string) => {
    // Extract city name from "City, Country" format
    const cityName = location.split(',')[0].trim();
    fetchWeatherData(cityName);
  };

  const getMetricTooltip = (metric: string) => {
    switch (metric) {
      case 'humidity':
        return "Humidity measures moisture in the air. Levels above 60% can feel muggy, while below 30% may dry your skin.";
      case 'wind':
        return "Wind speed indicates air movement. Speeds above 20 km/h may feel breezy. Secure loose objects if speeds exceed 40 km/h.";
      case 'pressure':
        return "Atmospheric pressure affects weather patterns. High pressure (>1020 hPa) often means clear skies, low pressure (<1000 hPa) can indicate storms.";
      case 'visibility':
        return "Visibility shows how far you can see. Less than 1km is poor visibility, affecting driving conditions.";
      case 'feels-like':
        return "Feels-like temperature accounts for humidity and wind, showing how hot or cold it actually feels to your body.";
      default:
        return "";
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [user, preferences.default_location]);

  const severeWeatherAlert = weatherData ? getSevereWeatherAlert(weatherData) : null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 flex items-center justify-center">
        <ParticleWeather condition="clear" intensity={0.5} />
        <div className="text-center text-white relative z-10">
          <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl">Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen relative overflow-hidden">
        <WeatherBackground condition={weatherData?.condition || 'clear'} />
        <ParticleWeather
          condition={weatherData?.condition || 'clear'}
          intensity={particleIntensity}
        />

        <div className="relative z-10 min-h-screen bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  🌈 Epic Weather Universe
                </h1>
                <p className="text-white/80 text-lg">
                  Real-time weather with mind-blowing effects & gamification ✨
                </p>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 lg:items-center">
                {/* View Mode Toggles */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setViewMode('normal')}
                    className={`${viewMode === 'normal' ? 'bg-purple-500' : 'bg-white/20'} hover:bg-purple-600 text-white`}
                    size="sm"
                  >
                    <Sun className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('globe')}
                    className={`${viewMode === 'globe' ? 'bg-blue-500' : 'bg-white/20'} hover:bg-blue-600 text-white`}
                    size="sm"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('game')}
                    className={`${viewMode === 'game' ? 'bg-green-500' : 'bg-white/20'} hover:bg-green-600 text-white`}
                    size="sm"
                  >
                    <Gamepad2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Particle Intensity */}
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">Effects:</span>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.5"
                    value={particleIntensity}
                    onChange={(e) => setParticleIntensity(Number(e.target.value))}
                    className="w-20"
                  />
                </div>

                {/* User Authentication */}
                <div className="flex items-center gap-2">
                  {user ? (
                    <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="bg-white/20 hover:bg-white/30 text-white border-white/50">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>User Profile & Preferences</DialogTitle>
                        </DialogHeader>
                        <UserProfile onClose={() => setProfileOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button
                      onClick={() => navigate('/auth')}
                      variant="outline"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/50"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>

                {/* Search and Controls */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search city or ZIP code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/90 border-white/50 text-gray-900 placeholder-gray-600 min-w-64"
                  />
                  <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    <Search className="w-4 h-4" />
                  </Button>
                </form>
                
                <Button
                  onClick={() => setIsCelsius(!isCelsius)}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/50"
                >
                  °{isCelsius ? 'F' : 'C'}
                </Button>
              </div>
            </div>

            {/* Voice Search */}
            <div className="mb-6">
              <VoiceWeatherSearch onSearch={handleVoiceSearch} />
            </div>

            {/* Favorite Locations (for logged in users) */}
            {user && preferences.favorite_locations.length > 0 && (
              <Card className="mb-6 bg-white/10 backdrop-blur-md border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Favorite Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {preferences.favorite_locations.map((location, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleFavoriteLocationClick(location)}
                        className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white border-white/50"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        {location}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-white">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {severeWeatherAlert && (
              <Alert className="mb-6 bg-orange-500/20 border-orange-500/50 text-white">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-semibold">{severeWeatherAlert}</AlertDescription>
              </Alert>
            )}

            {weatherData && (
              <>
                {/* Main Content Based on View Mode */}
                {viewMode === 'globe' && (
                  <div className="mb-8">
                    <WeatherGlobe 
                      weatherData={weatherData}
                      formatTemp={formatTemp}
                    />
                  </div>
                )}

                {viewMode === 'game' && (
                  <div className="mb-8">
                    <WeatherGameification
                      weatherData={weatherData}
                      forecastData={forecastData}
                      formatTemp={formatTemp}
                    />
                  </div>
                )}

                {/* Current Weather - Always show in normal mode */}
                {viewMode === 'normal' && (
                  <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                      <WeatherCard 
                        weatherData={weatherData}
                        formatTemp={formatTemp}
                        getWeatherTip={getWeatherTip}
                        lastUpdated={lastUpdated}
                      />
                      
                      {/* Add to Favorites Button */}
                      <div className="mt-4">
                        <Button
                          onClick={handleAddToFavorites}
                          variant="outline"
                          className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-white border-white/50"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {user ? 'Add to Favorites' : 'Sign in to Save'}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Weather Details */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gauge className="w-5 h-5" />
                          Weather Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg cursor-help border border-red-500/30">
                              <div className="flex items-center gap-2">
                                <Thermometer className="w-4 h-4" />
                                <span>Feels like</span>
                              </div>
                              <span className="font-semibold">{formatTemp(weatherData.feelsLike)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{getMetricTooltip('feels-like')}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg cursor-help border border-blue-500/30">
                              <div className="flex items-center gap-2">
                                <Droplets className="w-4 h-4" />
                                <span>Humidity</span>
                              </div>
                              <span className="font-semibold">{weatherData.humidity}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{getMetricTooltip('humidity')}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg cursor-help border border-green-500/30">
                              <div className="flex items-center gap-2">
                                <Wind className="w-4 h-4" />
                                <span>Wind Speed</span>
                              </div>
                              <span className="font-semibold">{Math.round(weatherData.windSpeed)} km/h</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{getMetricTooltip('wind')}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg cursor-help border border-purple-500/30">
                              <div className="flex items-center gap-2">
                                <Gauge className="w-4 h-4" />
                                <span>Pressure</span>
                              </div>
                              <span className="font-semibold">{weatherData.pressure} hPa</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{getMetricTooltip('pressure')}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg cursor-help border border-indigo-500/30">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                <span>Visibility</span>
                              </div>
                              <span className="font-semibold">{weatherData.visibility} km</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{getMetricTooltip('visibility')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Weather Mood Recommendations */}
                <div className="mb-8">
                  <WeatherMoodRecommendations
                    weatherData={weatherData}
                    formatTemp={formatTemp}
                  />
                </div>

                {/* Thunderstorm Prediction */}
                <div className="mb-8">
                  <ThunderstormPredictor />
                </div>

                {/* 5-Day Forecast */}
                {forecastData.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sun className="w-5 h-5" />
                        5-Day Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {forecastData.map((day, index) => (
                          <ForecastCard
                            key={index}
                            forecast={day}
                            formatTemp={formatTemp}
                            getWeatherTip={getWeatherTip}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Footer */}
            <div className="mt-12 text-center text-white/70">
              <p className="text-sm">
                🚀 Epic Weather Universe - Powered by OpenWeatherMap API & Creative Magic ✨
                {lastUpdated && (
                  <span className="block mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;
