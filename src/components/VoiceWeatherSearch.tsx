
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface VoiceWeatherSearchProps {
  onSearch: (query: string) => void;
  onSpeak?: (text: string) => void;
}

export const VoiceWeatherSearch: React.FC<VoiceWeatherSearchProps> = ({ 
  onSearch, 
  onSpeak 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.toLowerCase();
        setTranscript(transcript);
        
        if (result.isFinal) {
          console.log('Voice input:', transcript);
          
          // Process voice commands
          if (transcript.includes('weather in') || transcript.includes('weather for')) {
            const locationMatch = transcript.match(/weather (?:in|for) (.+)/);
            if (locationMatch) {
              onSearch(locationMatch[1].trim());
              speakResponse(`Getting weather for ${locationMatch[1]}`);
            }
          } else if (transcript.includes('current weather') || transcript.includes('weather here')) {
            onSearch('');
            speakResponse('Getting current weather for your location');
          } else if (transcript.length > 2) {
            onSearch(transcript);
            speakResponse(`Searching weather for ${transcript}`);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
      setIsSupported(true);
    }
  }, [onSearch]);

  const speakResponse = (text: string) => {
    if (onSpeak) {
      onSpeak(text);
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
    }
  };

  const testSpeak = () => {
    speakResponse('Voice control is working! Try saying "weather in New York" or "current weather"');
  };

  if (!isSupported) {
    return (
      <Card className="bg-red-500/20 border-red-500/50">
        <CardContent className="p-4">
          <p className="text-white text-sm">
            Voice control not supported in this browser. Try Chrome or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleListening}
            className={`${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            } transition-all duration-300`}
            size="lg"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isListening ? 'Stop' : 'Voice Search'}
          </Button>
          
          <Button
            onClick={testSpeak}
            variant="outline"
            className="bg-white/20 hover:bg-white/30 text-white border-white/50"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Test Voice
          </Button>
          
          <div className="flex-1">
            {isListening && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Listening...</span>
              </div>
            )}
            
            {transcript && (
              <div className="text-sm bg-white/20 rounded px-3 py-1 mt-2">
                "{transcript}"
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-xs text-white/70">
          <p>Try saying: "Weather in Tokyo", "Current weather", or just say any city name</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
