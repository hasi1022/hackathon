
import React from 'react';

interface WeatherBackgroundProps {
  condition: string;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ condition }) => {
  const getBackgroundGradient = (condition: string) => {
    const cond = condition.toLowerCase();
    
    if (cond.includes('clear') || cond.includes('sun')) {
      return 'from-amber-400 via-orange-500 to-yellow-600';
    } else if (cond.includes('cloud')) {
      return 'from-gray-400 via-gray-500 to-gray-600';
    } else if (cond.includes('rain') || cond.includes('drizzle')) {
      return 'from-blue-600 via-blue-700 to-indigo-800';
    } else if (cond.includes('thunder') || cond.includes('storm')) {
      return 'from-gray-800 via-gray-900 to-black';
    } else if (cond.includes('snow')) {
      return 'from-blue-200 via-blue-300 to-blue-400';
    } else if (cond.includes('mist') || cond.includes('fog')) {
      return 'from-gray-300 via-gray-400 to-gray-500';
    } else {
      return 'from-blue-400 via-blue-600 to-blue-800';
    }
  };

  const getAnimationElements = (condition: string) => {
    const cond = condition.toLowerCase();
    
    if (cond.includes('rain') || cond.includes('drizzle')) {
      return (
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-4 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      );
    } else if (cond.includes('snow')) {
      return (
        <div className="absolute inset-0 opacity-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      );
    } else if (cond.includes('clear') || cond.includes('sun')) {
      return (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-32 h-32 bg-yellow-300 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-40 right-40 w-16 h-16 bg-orange-300 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient(condition)} transition-all duration-1000`}>
      {getAnimationElements(condition)}
      
      {/* Overlay pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, white 1px, transparent 1px),
                           radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }} />
      </div>
    </div>
  );
};
