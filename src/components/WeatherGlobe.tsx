
import React, { useEffect, useRef, useState } from 'react';
import { Thermometer, Droplets, Wind, Eye } from 'lucide-react';

interface WeatherGlobeProps {
  weatherData: {
    temp: number;
    humidity: number;
    windSpeed: number;
    visibility: number;
    condition: string;
  };
  formatTemp: (temp: number) => string;
}

export const WeatherGlobe: React.FC<WeatherGlobeProps> = ({ weatherData, formatTemp }) => {
  const globeRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + (hovered ? 2 : 0.5));
    }, 50);

    return () => clearInterval(interval);
  }, [hovered]);

  const getGlobeColor = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('clear') || cond.includes('sun')) {
      return 'from-amber-400 via-orange-500 to-yellow-600';
    } else if (cond.includes('rain')) {
      return 'from-blue-500 via-blue-600 to-indigo-700';
    } else if (cond.includes('snow')) {
      return 'from-blue-200 via-white to-blue-300';
    } else if (cond.includes('cloud')) {
      return 'from-gray-400 via-gray-500 to-gray-600';
    }
    return 'from-blue-400 via-blue-500 to-blue-600';
  };

  const weatherStats = [
    { icon: Thermometer, value: formatTemp(weatherData.temp), label: 'Temp', color: 'text-red-400' },
    { icon: Droplets, value: `${weatherData.humidity}%`, label: 'Humidity', color: 'text-blue-400' },
    { icon: Wind, value: `${Math.round(weatherData.windSpeed)}`, label: 'km/h', color: 'text-green-400' },
    { icon: Eye, value: `${weatherData.visibility}`, label: 'km', color: 'text-purple-400' },
  ];

  return (
    <div className="relative flex items-center justify-center p-8">
      {/* 3D Globe */}
      <div
        ref={globeRef}
        className="relative w-48 h-48 cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Main Globe */}
        <div 
          className={`w-full h-full rounded-full bg-gradient-to-br ${getGlobeColor(weatherData.condition)} shadow-2xl relative overflow-hidden`}
          style={{
            transform: `rotateY(${rotation}deg) rotateX(10deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.3s ease'
          }}
        >
          {/* Globe shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12" />
          
          {/* Weather pattern overlay */}
          <div className="absolute inset-0 rounded-full opacity-30">
            {weatherData.condition.toLowerCase().includes('cloud') && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 rounded-full" />
            )}
            {weatherData.condition.toLowerCase().includes('rain') && (
              <>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-6 bg-white/60 rounded-full"
                    style={{
                      left: `${20 + i * 10}%`,
                      top: `${10 + (i % 3) * 20}%`,
                      transform: `rotate(${15 + i * 5}deg)`,
                      animation: `fadeInOut ${1 + i * 0.2}s infinite alternate`
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        </div>

        {/* Floating stats around globe */}
        {weatherStats.map((stat, index) => {
          const angle = (index * 90) + rotation * 0.5;
          const x = Math.cos(angle * Math.PI / 180) * 120;
          const y = Math.sin(angle * Math.PI / 180) * 120;
          
          return (
            <div
              key={index}
              className="absolute bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/20 text-white"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                animation: `float ${2 + index * 0.5}s ease-in-out infinite alternate`
              }}
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <div>
                  <div className="text-sm font-bold">{stat.value}</div>
                  <div className="text-xs opacity-70">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translate(-50%, -50%) translateY(0px); }
          100% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0.3; }
          100% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
