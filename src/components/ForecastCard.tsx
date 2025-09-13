
import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ForecastData {
  date: string;
  temp: { min: number; max: number };
  condition: string;
  icon: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

interface ForecastCardProps {
  forecast: ForecastData;
  formatTemp: (temp: number) => string;
  getWeatherTip: (condition: string, temp: number) => string;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
  forecast,
  formatTemp,
  getWeatherTip
}) => {
  const getWeatherEmoji = (description?: string) => {
  if (!description) return "🌡️"; // default if undefined

  const lower = description.toLowerCase();
  if (lower.includes("cloud")) return "☁️";
  if (lower.includes("rain")) return "🌧️";
  if (lower.includes("sun") || lower.includes("clear")) return "☀️";
  return "🌡️";
};


  const getDayTip = (forecast: ForecastData) => {
    const avgTemp = (forecast.temp.min + forecast.temp.max) / 2;
    const baseTip = forecast.condition 
      ? getWeatherTip(forecast.condition, avgTemp)
      : "Weather data unavailable";
    
    if (forecast.windSpeed > 25) {
      return `${baseTip} Expect windy conditions with speeds up to ${Math.round(forecast.windSpeed)} km/h.`;
    }
    
    if (forecast.humidity > 80) {
      return `${baseTip} High humidity (${forecast.humidity}%) may make it feel more uncomfortable.`;
    }
    
    return baseTip;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 cursor-help hover:bg-white/20 transition-all duration-200 border border-white/20">
          <div className="text-center space-y-3">
            {/* Date */}
            <p className="font-semibold text-sm text-white/90">
              {forecast.date}
            </p>
            
            {/* Weather Icon */}
            <div className="text-3xl">
              {getWeatherEmoji(forecast.condition)}
            </div>
            
            {/* Temperature Range */}
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {formatTemp(forecast.temp.max)}
              </p>
              <p className="text-sm text-white/70">
                {formatTemp(forecast.temp.min)}
              </p>
            </div>
            
            {/* Condition */}
            <p className="text-xs text-white/80 capitalize leading-tight">
              {forecast.description}
            </p>
            
            {/* Additional info */}
            <div className="grid grid-cols-2 gap-1 text-xs text-white/70 mt-2">
              <div>💧 {forecast.humidity}%</div>
              <div>💨 {Math.round(forecast.windSpeed)}</div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2">
          <p className="font-semibold">{forecast.date} Forecast</p>
          <p className="text-sm">{getDayTip(forecast)}</p>
          <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
            <div>High: {formatTemp(forecast.temp.max)}</div>
            <div>Low: {formatTemp(forecast.temp.min)}</div>
            <div>Humidity: {forecast.humidity}%</div>
            <div>Wind: {Math.round(forecast.windSpeed)} km/h</div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
