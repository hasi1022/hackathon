
import React, { useState } from 'react';
import { Heart, Coffee, Shirt, Umbrella, Sunglasses, Music, Camera, Gamepad2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherMoodRecommendationsProps {
  weatherData: WeatherData;
  formatTemp: (temp: number) => string;
}

interface Recommendation {
  category: string;
  icon: any;
  items: string[];
  color: string;
}

export const WeatherMoodRecommendations: React.FC<WeatherMoodRecommendationsProps> = ({
  weatherData,
  formatTemp
}) => {
  const [selectedMood, setSelectedMood] = useState<string>('energetic');

  const moods = [
    { id: 'energetic', label: '⚡ Energetic', color: 'bg-yellow-500' },
    { id: 'cozy', label: '🏠 Cozy', color: 'bg-orange-500' },
    { id: 'adventurous', label: '🏔️ Adventurous', color: 'bg-green-500' },
    { id: 'creative', label: '🎨 Creative', color: 'bg-purple-500' },
    { id: 'romantic', label: '💕 Romantic', color: 'bg-pink-500' },
    { id: 'productive', label: '💼 Productive', color: 'bg-blue-500' }
  ];

  const getWeatherRecommendations = (mood: string): Recommendation[] => {
    const temp = weatherData.temp;
    const condition = weatherData.condition.toLowerCase();
    const isHot = temp > 25;
    const isCold = temp < 10;
    const isRainy = condition.includes('rain');
    const isSunny = condition.includes('clear') || condition.includes('sun');

    const baseRecommendations = {
      energetic: [
        {
          category: 'Activities',
          icon: Gamepad2,
          items: isSunny && !isHot ? ['Go for a run', 'Bike ride', 'Outdoor workout'] :
                 isRainy ? ['Indoor climbing', 'Dancing', 'Home workout'] :
                 isCold ? ['Ice skating', 'Winter sports', 'Hot yoga'] :
                 ['Swimming', 'Beach volleyball', 'Water sports'],
          color: 'text-yellow-400'
        },
        {
          category: 'Outfit',
          icon: Shirt,
          items: isHot ? ['Light athletic wear', 'Moisture-wicking fabrics', 'Sun hat'] :
                 isCold ? ['Thermal layers', 'Warm activewear', 'Insulated jacket'] :
                 ['Comfortable sportswear', 'Light jacket', 'Good sneakers'],
          color: 'text-blue-400'
        }
      ],
      cozy: [
        {
          category: 'Activities',
          icon: Coffee,
          items: isRainy ? ['Read by the window', 'Bake cookies', 'Movie marathon'] :
                 isCold ? ['Hot cocoa by the fire', 'Knitting', 'Board games'] :
                 ['Outdoor reading', 'Picnic in shade', 'Garden tea party'],
          color: 'text-orange-400'
        },
        {
          category: 'Food & Drink',
          icon: Coffee,
          items: isCold ? ['Hot chocolate', 'Soup and bread', 'Warm pastries'] :
                 isHot ? ['Iced coffee', 'Cold smoothies', 'Fresh salads'] :
                 ['Herbal tea', 'Comfort food', 'Homemade treats'],
          color: 'text-red-400'
        }
      ],
      adventurous: [
        {
          category: 'Exploration',
          icon: Camera,
          items: isSunny ? ['Photography walk', 'Nature hike', 'City exploration'] :
                 isRainy ? ['Museum visit', 'Indoor rock climbing', 'Cooking new cuisine'] :
                 isCold ? ['Winter photography', 'Snow activities', 'Hot spring visit'] :
                 ['Beach exploration', 'Water activities', 'Sunset viewing'],
          color: 'text-green-400'
        },
        {
          category: 'Gear',
          icon: Umbrella,
          items: isRainy ? ['Waterproof camera', 'Rain boots', 'Umbrella'] :
                 isSunny ? ['Sunscreen', 'Water bottle', 'Camera'] :
                 ['Weather-appropriate gear', 'Comfortable shoes', 'Backpack'],
          color: 'text-purple-400'
        }
      ],
      creative: [
        {
          category: 'Inspiration',
          icon: Music,
          items: isRainy ? ['Rain sound recording', 'Storm photography', 'Moody art'] :
                 isSunny ? ['Light painting', 'Nature sketching', 'Golden hour photos'] :
                 ['Weather journaling', 'Seasonal crafts', 'Color studies'],
          color: 'text-purple-400'
        }
      ],
      romantic: [
        {
          category: 'Date Ideas',
          icon: Heart,
          items: isSunny ? ['Sunset picnic', 'Beach walk', 'Outdoor dining'] :
                 isRainy ? ['Cozy cafe date', 'Indoor wine tasting', 'Cooking together'] :
                 isCold ? ['Hot chocolate date', 'Museum visit', 'Fireplace dinner'] :
                 ['Stargazing', 'Garden stroll', 'Rooftop dinner'],
          color: 'text-pink-400'
        }
      ],
      productive: [
        {
          category: 'Work Environment',
          icon: Coffee,
          items: isSunny && !isHot ? ['Outdoor workspace', 'Balcony office', 'Park bench work'] :
                 isRainy ? ['Cozy indoor setup', 'Coffee shop work', 'Library session'] :
                 ['Climate-controlled space', 'Focused indoor work', 'Minimal distractions'],
          color: 'text-blue-400'
        }
      ]
    };

    return baseRecommendations[mood as keyof typeof baseRecommendations] || [];
  };

  const getWeatherMoodDescription = () => {
    const condition = weatherData.condition.toLowerCase();
    const temp = weatherData.temp;
    
    if (condition.includes('rain')) {
      return "🌧️ Rainy weather creates the perfect atmosphere for cozy indoor activities and introspection.";
    } else if (condition.includes('sun') || condition.includes('clear')) {
      if (temp > 25) {
        return "☀️ Hot sunny weather is ideal for cooling activities and staying hydrated.";
      } else {
        return "🌤️ Beautiful sunny weather opens up endless possibilities for outdoor adventures!";
      }
    } else if (condition.includes('snow')) {
      return "❄️ Snowy weather brings magical winter vibes perfect for seasonal activities.";
    } else if (condition.includes('cloud')) {
      return "☁️ Cloudy weather provides comfortable conditions for most activities.";
    }
    return "🌈 Every weather brings its own unique opportunities!";
  };

  const recommendations = getWeatherRecommendations(selectedMood);

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />
          Weather Mood & Recommendations
        </CardTitle>
        <p className="text-sm text-white/80">
          {getWeatherMoodDescription()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Selector */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-white/90">What's your mood today?</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {moods.map((mood) => (
              <Button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`${
                  selectedMood === mood.id 
                    ? `${mood.color} text-white shadow-lg transform scale-105` 
                    : 'bg-white/20 hover:bg-white/30 text-white'
                } transition-all duration-200 text-xs`}
                size="sm"
              >
                {mood.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white/90">
            Perfect for {moods.find(m => m.id === selectedMood)?.label} mood:
          </h4>
          
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <rec.icon className={`w-4 h-4 ${rec.color}`} />
                <span className="font-semibold text-sm">{rec.category}</span>
              </div>
              
              <div className="grid gap-2">
                {rec.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex}
                    className="text-sm bg-white/10 rounded px-3 py-2 flex items-center gap-2"
                  >
                    <span className="text-xs">•</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Weather-specific tip */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <span className="font-semibold text-sm">Weather-Specific Tip</span>
          </div>
          <p className="text-sm text-white/90">
            With {formatTemp(weatherData.temp)} and {weatherData.condition.toLowerCase()} conditions, 
            it's perfect weather for {selectedMood} activities. 
            {weatherData.humidity > 70 && " High humidity - stay hydrated!"}
            {weatherData.windSpeed > 20 && " Windy conditions - secure loose items!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
