
import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WeatherGameificationProps {
  weatherData: {
    temp: number;
    condition: string;
    humidity: number;
  };
  forecastData: Array<{
    date: string;
    temp: { min: number; max: number };
    condition: string;
  }>;
  formatTemp: (temp: number) => string;
}

interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  predictions: number;
  accuracy: number;
  badges: string[];
}

interface Prediction {
  id: string;
  date: string;
  predictedTemp: number;
  predictedCondition: string;
  actualTemp?: number;
  actualCondition?: string;
  points?: number;
}

export const WeatherGameification: React.FC<WeatherGameificationProps> = ({
  weatherData,
  forecastData,
  formatTemp
}) => {
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    streak: 0,
    predictions: 0,
    accuracy: 0,
    badges: []
  });

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [todaysPrediction, setTodaysPrediction] = useState({
    temp: weatherData.temp,
    condition: weatherData.condition
  });
  const [showChallenge, setShowChallenge] = useState(false);

  useEffect(() => {
    // Load saved data from localStorage
    const savedStats = localStorage.getItem('weatherGameStats');
    const savedPredictions = localStorage.getItem('weatherPredictions');
    
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
    
    if (savedPredictions) {
      setPredictions(JSON.parse(savedPredictions));
    }

    // Check if it's time for daily challenge
    const lastChallenge = localStorage.getItem('lastWeatherChallenge');
    const today = new Date().toDateString();
    
    if (lastChallenge !== today) {
      setShowChallenge(true);
    }
  }, []);

  const dailyChallenges = [
    { id: 'temp-guess', title: 'Temperature Master', description: 'Guess tomorrow\'s high temperature within 3°', reward: 50 },
    { id: 'condition-predict', title: 'Weather Prophet', description: 'Predict tomorrow\'s weather condition', reward: 30 },
    { id: 'humidity-expert', title: 'Humidity Expert', description: 'Guess if humidity will be above or below 60%', reward: 25 },
    { id: 'streak-builder', title: 'Streak Builder', description: 'Check weather 3 days in a row', reward: 75 }
  ];

  const badges = [
    { id: 'first-prediction', name: 'First Steps', icon: '🌱', description: 'Made your first prediction' },
    { id: 'weather-wizard', name: 'Weather Wizard', icon: '🧙‍♂️', description: 'Reached level 5' },
    { id: 'streak-master', name: 'Streak Master', icon: '🔥', description: '7-day streak' },
    { id: 'accuracy-ace', name: 'Accuracy Ace', icon: '🎯', description: '80% prediction accuracy' },
    { id: 'storm-chaser', name: 'Storm Chaser', icon: '⛈️', description: 'Predicted 5 storms correctly' },
    { id: 'sunny-sage', name: 'Sunny Sage', icon: '☀️', description: 'Predicted 10 sunny days' }
  ];

  const submitPrediction = () => {
    const newPrediction: Prediction = {
      id: Date.now().toString(),
      date: new Date().toDateString(),
      predictedTemp: todaysPrediction.temp,
      predictedCondition: todaysPrediction.condition
    };

    const updatedPredictions = [...predictions, newPrediction];
    setPredictions(updatedPredictions);
    
    // Award XP for making prediction
    const newXP = userStats.xp + 25;
    const newLevel = Math.floor(newXP / 100) + 1;
    
    const updatedStats = {
      ...userStats,
      xp: newXP,
      level: newLevel,
      predictions: userStats.predictions + 1,
      streak: userStats.streak + 1
    };

    // Check for new badges
    const newBadges = [...userStats.badges];
    if (!newBadges.includes('first-prediction') && updatedStats.predictions === 1) {
      newBadges.push('first-prediction');
    }
    if (!newBadges.includes('weather-wizard') && updatedStats.level >= 5) {
      newBadges.push('weather-wizard');
    }
    if (!newBadges.includes('streak-master') && updatedStats.streak >= 7) {
      newBadges.push('streak-master');
    }

    updatedStats.badges = newBadges;
    setUserStats(updatedStats);

    // Save to localStorage
    localStorage.setItem('weatherGameStats', JSON.stringify(updatedStats));
    localStorage.setItem('weatherPredictions', JSON.stringify(updatedPredictions));
    localStorage.setItem('lastWeatherChallenge', new Date().toDateString());
    
    setShowChallenge(false);
  };

  const getWeatherEmoji = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('clear') || cond.includes('sun')) return '☀️';
    if (cond.includes('cloud')) return '☁️';
    if (cond.includes('rain')) return '🌧️';
    if (cond.includes('snow')) return '❄️';
    if (cond.includes('thunder')) return '⛈️';
    return '🌤️';
  };

  const levelProgress = (userStats.xp % 100);

  return (
    <Card className="bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Weather Master Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold">Level</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{userStats.level}</div>
            <Progress value={levelProgress} className="mt-2 h-2" />
            <div className="text-xs text-white/70 mt-1">{userStats.xp % 100}/100 XP</div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold">Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{userStats.streak}</div>
            <div className="text-xs text-white/70">days</div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold">Accuracy</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{userStats.accuracy}%</div>
            <div className="text-xs text-white/70">predictions</div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold">Badges</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{userStats.badges.length}</div>
            <div className="text-xs text-white/70">earned</div>
          </div>
        </div>

        {/* Badges */}
        {userStats.badges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Your Badges
            </h4>
            <div className="flex flex-wrap gap-2">
              {userStats.badges.map((badgeId) => {
                const badge = badges.find(b => b.id === badgeId);
                return badge ? (
                  <div
                    key={badgeId}
                    className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg p-2 border border-yellow-400/30 text-center"
                    title={badge.description}
                  >
                    <div className="text-lg">{badge.icon}</div>
                    <div className="text-xs font-semibold">{badge.name}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Daily Challenge */}
        {showChallenge && (
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Today's Challenge
            </h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">🎯 Predict tomorrow's weather and earn bonus XP!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/80 mb-1 block">Temperature Prediction</label>
                    <input
                      type="range"
                      min="-10"
                      max="40"
                      value={todaysPrediction.temp}
                      onChange={(e) => setTodaysPrediction(prev => ({
                        ...prev,
                        temp: Number(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <div className="text-center text-sm font-semibold text-blue-400">
                      {formatTemp(todaysPrediction.temp)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-white/80 mb-1 block">Weather Condition</label>
                    <select
                      value={todaysPrediction.condition}
                      onChange={(e) => setTodaysPrediction(prev => ({
                        ...prev,
                        condition: e.target.value
                      }))}
                      className="w-full bg-white/20 rounded px-3 py-2 text-white text-sm border border-white/30"
                    >
                      <option value="Clear">☀️ Clear</option>
                      <option value="Clouds">☁️ Cloudy</option>
                      <option value="Rain">🌧️ Rainy</option>
                      <option value="Snow">❄️ Snowy</option>
                      <option value="Thunderstorm">⛈️ Stormy</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={submitPrediction}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                Submit Prediction (+25 XP)
              </Button>
            </div>
          </div>
        )}

        {/* Recent Predictions */}
        {predictions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Recent Predictions</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {predictions.slice(-3).reverse().map((prediction) => (
                <div key={prediction.id} className="bg-white/10 rounded p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>{prediction.date}</span>
                    <span className="flex items-center gap-1">
                      {getWeatherEmoji(prediction.predictedCondition)}
                      {formatTemp(prediction.predictedTemp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
