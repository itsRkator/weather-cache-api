/**
 * Mock weather data for testing
 */

const mockWeatherData = {
  london: {
    coord: { lon: -0.1257, lat: 51.5085 },
    weather: [
      {
        id: 500,
        main: 'Rain',
        description: 'light rain',
        icon: '10d'
      }
    ],
    base: 'stations',
    main: {
      temp: 15.2,
      feels_like: 14.1,
      temp_min: 13.5,
      temp_max: 16.8,
      pressure: 1013,
      humidity: 65
    },
    visibility: 10000,
    wind: {
      speed: 3.2,
      deg: 180
    },
    clouds: {
      all: 75
    },
    dt: 1640995200,
    sys: {
      type: 2,
      id: 2019646,
      country: 'GB',
      sunrise: 1640947200,
      sunset: 1640976000
    },
    timezone: 0,
    id: 2643743,
    name: 'London',
    cod: 200
  },
  paris: {
    coord: { lon: 2.3522, lat: 48.8566 },
    weather: [
      {
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }
    ],
    base: 'stations',
    main: {
      temp: 18.5,
      feels_like: 17.8,
      temp_min: 16.2,
      temp_max: 20.1,
      pressure: 1018,
      humidity: 55
    },
    visibility: 10000,
    wind: {
      speed: 2.1,
      deg: 225
    },
    clouds: {
      all: 0
    },
    dt: 1640995200,
    sys: {
      type: 2,
      id: 2019646,
      country: 'FR',
      sunrise: 1640946000,
      sunset: 1640974800
    },
    timezone: 3600,
    id: 2988507,
    name: 'Paris',
    cod: 200
  },
  tokyo: {
    coord: { lon: 139.6917, lat: 35.6895 },
    weather: [
      {
        id: 801,
        main: 'Clouds',
        description: 'few clouds',
        icon: '02d'
      }
    ],
    base: 'stations',
    main: {
      temp: 22.3,
      feels_like: 21.5,
      temp_min: 20.1,
      temp_max: 24.8,
      pressure: 1015,
      humidity: 60
    },
    visibility: 10000,
    wind: {
      speed: 4.5,
      deg: 135
    },
    clouds: {
      all: 20
    },
    dt: 1640995200,
    sys: {
      type: 2,
      id: 2019646,
      country: 'JP',
      sunrise: 1640928000,
      sunset: 1640956800
    },
    timezone: 32400,
    id: 1850144,
    name: 'Tokyo',
    cod: 200
  }
};

const mockErrorResponses = {
  cityNotFound: {
    cod: '404',
    message: 'city not found'
  },
  invalidAPIKey: {
    cod: 401,
    message: 'Invalid API key. Please see http://openweathermap.org/faq#error401 for more info.'
  },
  serverError: {
    cod: 500,
    message: 'Internal server error'
  }
};

const transformedWeatherData = {
  london: {
    city: 'London',
    country: 'GB',
    temperature: {
      current: 15,
      feelsLike: 14,
      min: 14,
      max: 17
    },
    humidity: 65,
    pressure: 1013,
    description: 'light rain',
    main: 'Rain',
    wind: {
      speed: 3.2,
      direction: 180
    },
    visibility: 10000,
    timestamp: expect.any(String),
    source: 'openweathermap'
  }
};

module.exports = {
  mockWeatherData,
  mockErrorResponses,
  transformedWeatherData
};
