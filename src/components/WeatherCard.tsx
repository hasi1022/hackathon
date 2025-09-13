
import React from 'react';
import { MapPin, Calendar, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
}

interface WeatherCardProps {
  weatherData: WeatherData;
  formatTemp: (temp: number) => string;
  getWeatherTip: (condition: string, temp: number) => string;
  lastUpdated: Date | null;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weatherData,
  formatTemp,
  getWeatherTip,
  lastUpdated
}) => {
  const getWeatherEmoji = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('clear') || cond.includes('sun')) return '☀️';
    if (cond.includes('cloud')) return '☁️';
    if (cond.includes('rain')) return '🌧️';
    if (cond.includes('drizzle')) return '🌦️';
    if (cond.includes('thunder') || cond.includes('storm')) return '⛈️';
    if (cond.includes('snow')) return '❄️';
    if (cond.includes('mist') || cond.includes('fog')) return '🌫️';
    if (cond.includes('wind')) return '💨';
    return '🌤️';
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Location and Date */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white/80" />
              <span className="text-xl font-semibold">
                {weatherData.name}, {weatherData.country}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Main Weather Display */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Temperature */}
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-6xl lg:text-8xl font-light leading-none">
                  {Math.round(weatherData.temp)}°
                </span>
                <div className="text-4xl">
                  {getWeatherEmoji(weatherData.condition)}
                </div>
              </div>
              <p className="text-white/80 text-lg capitalize">
                {weatherData.description}
              </p>
            </div>

            {/* Weather Tip */}
            <div className="flex-1 lg:ml-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white/20 rounded-lg p-4 cursor-help border border-white/30">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-200 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Weather Tip</h4>
                        <p className="text-sm text-white/90 leading-relaxed">
                          {getWeatherTip(weatherData.condition, weatherData.temp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click for more detailed weather guidance</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-semibold">{formatTemp(weatherData.feelsLike)}</p>
              <p className="text-white/70 text-sm">Feels like</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{weatherData.humidity}%</p>
              <p className="text-white/70 text-sm">Humidity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{Math.round(weatherData.windSpeed)}</p>
              <p className="text-white/70 text-sm">km/h Wind</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
