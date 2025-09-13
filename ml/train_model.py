import os
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import json

# Tomorrow.io API configuration
API_KEY = "5EQZDJIyPYQJhIuKIgctgnKIwIk11eG7"
BASE_URL = "https://api.tomorrow.io/v4/timelines"

def fetch_weather_data(latitude, longitude):
    """
    Fetch current and forecast weather data from Tomorrow.io API
    """
    # Current weather
    current_url = f"https://api.tomorrow.io/v4/weather/realtime?apikey={API_KEY}&location={latitude},{longitude}&units=metric"
    # Forecast
    forecast_url = f"https://api.tomorrow.io/v4/weather/forecast?apikey={API_KEY}&location={latitude},{longitude}&units=metric"

    try:
        current_response = requests.get(current_url)
        forecast_response = requests.get(forecast_url)
        
        current_response.raise_for_status()
        forecast_response.raise_for_status()
        
        return {
            'current': current_response.json(),
            'forecast': forecast_response.json()
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def process_data(df):
    """
    Process DataFrame for training
    """
    # Features we'll use for prediction
    features = ['temperature', 'humidity', 'windSpeed', 'pressure', 'precipitation']
    X = df[features]
    y = df['thunderstorm_risk']
    
    return X, y

def train_model(df):
    """
    Train a Random Forest model for thunderstorm prediction
    """
    # Process data
    X, y = process_data(df)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)

    # Save model and scaler
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/thunderstorm_model.joblib')
    joblib.dump(scaler, 'models/scaler.joblib')

    # Calculate accuracy
    accuracy = model.score(X_test_scaled, y_test)
    print(f"Model accuracy: {accuracy:.2f}")

    return model, scaler

def predict_thunderstorm(current_weather, model, scaler):
    """
    Make prediction using the trained model
    """
    features = ['temperature', 'humidity', 'windSpeed', 'pressure', 'precipitation']
    
    # Prepare input data
    X = np.array([current_weather[f] for f in features]).reshape(1, -1)
    X_scaled = scaler.transform(X)
    
    # Get prediction and probabilities
    risk_level = model.predict(X_scaled)[0]
    probabilities = model.predict_proba(X_scaled)[0]
    max_prob = max(probabilities) * 100

    # Generate appropriate message based on risk level
    messages = {
        'green': "No significant thunderstorm risk detected.",
        'yellow': "Moderate risk of thunderstorms. Stay weather-aware.",
        'red': "High risk of severe thunderstorms. Take necessary precautions!"
    }

    return {
        'riskLevel': risk_level,
        'probability': round(max_prob, 1),
        'message': messages[risk_level]
    }

if __name__ == "__main__":
    # Example usage - multiple locations for better training data
    locations = [
        (40.7128, -74.0060),  # New York
        (34.0522, -118.2437), # Los Angeles
        (51.5074, -0.1278),   # London
        (35.6762, 139.6503),  # Tokyo
        (25.2048, 55.2708),   # Dubai
    ]
    
    all_data = []
    for lat, lon in locations:
        print(f"Fetching data for coordinates: {lat}, {lon}")
        weather_data = fetch_weather_data(lat, lon)
        if weather_data:
            # Process current weather
            current = weather_data['current']
            values = current['data']['values']
            
            data_point = {
                'temperature': values.get('temperature', 0),
                'humidity': values.get('humidity', 0),
                'windSpeed': values.get('windSpeed', 0),
                'pressure': values.get('pressureSeaLevel', 1013),
                'precipitation': values.get('precipitationIntensity', 0),
                'thunderstorm_risk': 'green'  # default
            }
            
            # Determine thunderstorm risk based on conditions
            if (data_point['humidity'] > 80 and 
                data_point['precipitation'] > 4 and 
                data_point['windSpeed'] > 20):
                data_point['thunderstorm_risk'] = 'red'
            elif (data_point['humidity'] > 70 and 
                  data_point['precipitation'] > 2 and 
                  data_point['windSpeed'] > 15):
                data_point['thunderstorm_risk'] = 'yellow'
            
            all_data.append(data_point)
            
            # Process forecast data for additional training points
            forecast = weather_data['forecast']
            for period in forecast['timelines']['hourly'][:24]:  # next 24 hours
                values = period['values']
                forecast_point = {
                    'temperature': values.get('temperature', 0),
                    'humidity': values.get('humidity', 0),
                    'windSpeed': values.get('windSpeed', 0),
                    'pressure': values.get('pressureSeaLevel', 1013),
                    'precipitation': values.get('precipitationIntensity', 0),
                    'thunderstorm_risk': 'green'  # default
                }
                
                # Apply same risk logic
                if (forecast_point['humidity'] > 80 and 
                    forecast_point['precipitation'] > 4 and 
                    forecast_point['windSpeed'] > 20):
                    forecast_point['thunderstorm_risk'] = 'red'
                elif (forecast_point['humidity'] > 70 and 
                      forecast_point['precipitation'] > 2 and 
                      forecast_point['windSpeed'] > 15):
                    forecast_point['thunderstorm_risk'] = 'yellow'
                
                all_data.append(forecast_point)
    
    if all_data:
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        
        # Train model
        model, scaler = train_model(df)
        
        # Example prediction
        current_weather = {
            'temperature': 25,
            'humidity': 80,
            'windSpeed': 15,
            'pressure': 1015,
            'precipitation': 2.5
        }
        
        prediction = predict_thunderstorm(current_weather, model, scaler)
        print("\nPrediction:", json.dumps(prediction, indent=2))