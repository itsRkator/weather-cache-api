# Weather Cache API

A robust Node.js weather API service built with Express.js that provides weather data with intelligent caching and retry mechanisms. The service follows MVC architecture and includes comprehensive error handling, health monitoring, and graceful degradation.

## Features

- 🌤️ **Weather Data**: Fetch current weather information for any city
- ⚡ **Intelligent Caching**: In-memory cache with configurable TTL (2-5 minutes)
- 🔄 **Retry Logic**: Exponential backoff for handling transient failures
- 🏥 **Health Monitoring**: Comprehensive health check endpoints
- 🛡️ **Error Handling**: Proper HTTP status codes and error responses
- 📊 **Cache Management**: View cache statistics and clear cache
- 🎭 **Mock Mode**: Works without API keys using mock data
- 🏗️ **MVC Architecture**: Clean separation of concerns

## Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd weather-cache-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Edit `.env` file with your configuration:
```env
PORT=3000
WEATHER_API_KEY=your_openweather_api_key_here
WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather
CACHE_TTL_MINUTES=3
MAX_RETRY_ATTEMPTS=3
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Weather Endpoints

#### Get Weather Data
```http
GET /weather?city=London
```

**Response:**
```json
{
  "success": true,
  "data": {
    "city": "London",
    "country": "GB",
    "temperature": {
      "current": 15,
      "feelsLike": 14,
      "min": 12,
      "max": 18
    },
    "humidity": 65,
    "pressure": 1013,
    "description": "clear sky",
    "main": "Clear",
    "wind": {
      "speed": 3.2,
      "direction": 180
    },
    "visibility": 10000,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "source": "openweathermap"
  }
}
```

#### Get Cache Statistics
```http
GET /weather/cache/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEntries": 5,
    "validEntries": 4,
    "expiredEntries": 1
  }
}
```

#### Clear Cache
```http
DELETE /weather/cache
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

### Health Endpoints

#### Basic Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1234567
  },
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "weather": "operational",
    "cache": "operational"
  }
}
```

#### Detailed Health Check
```http
GET /health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": { ... },
  "version": "1.0.0",
  "environment": "development",
  "dependencies": {
    "weatherAPI": {
      "status": "healthy",
      "responseTime": "245ms",
      "type": "external"
    },
    "cache": {
      "status": "healthy",
      "stats": {
        "totalEntries": 5,
        "validEntries": 4,
        "expiredEntries": 1
      }
    }
  }
}
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `HOST` | Server host | 0.0.0.0 | No |
| `WEATHER_API_KEY` | OpenWeatherMap API key | - | No* |
| `WEATHER_API_URL` | Weather API base URL | OpenWeatherMap | No |
| `CACHE_TTL_MINUTES` | Cache time-to-live in minutes | 3 | No |
| `MAX_RETRY_ATTEMPTS` | Maximum retry attempts | 3 | No |
| `NODE_ENV` | Environment mode | development | No |

*If no API key is provided, the service will use mock data.

### Cache Configuration

The service uses an in-memory cache with the following features:

- **TTL**: Configurable time-to-live (default: 3 minutes)
- **Automatic Cleanup**: Expired entries are cleaned up every 5 minutes
- **Statistics**: Track cache hit/miss ratios and entry counts
- **Manual Management**: Clear cache and view statistics via API

### Retry Logic

The service implements exponential backoff retry for:

- **5xx HTTP errors**: Server errors from the weather API
- **Network timeouts**: Connection timeouts and network issues
- **DNS resolution failures**: Network connectivity problems

Retry configuration:
- **Base delay**: 1 second
- **Maximum delay**: 8 seconds
- **Maximum attempts**: 3 (configurable)

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── weatherController.js
│   └── healthController.js
├── services/            # Business logic
│   ├── weatherService.js
│   └── cache.js
├── routes/              # Route definitions
│   ├── weatherRoutes.js
│   └── healthRoutes.js
├── middleware/          # Express middleware
│   ├── errorHandler.js
│   └── requestLogger.js
├── utils/               # Utility functions
│   └── retry.js
├── app.js              # Express app configuration
└── server.js           # Server entry point
```

## Error Handling

The API returns appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (missing city parameter)
- **404**: Not Found (city not found)
- **500**: Internal Server Error
- **503**: Service Unavailable (weather API down)

Error responses include:
```json
{
  "error": "Bad Request",
  "message": "City parameter is required",
  "example": "/weather?city=London"
}
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic server restarts on file changes.

### Testing

```bash
npm test
```

### Linting

The project follows standard JavaScript conventions. Consider adding ESLint for code quality:

```bash
npm install --save-dev eslint
npx eslint src/
```

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure proper logging
3. Set up process management (PM2, Docker, etc.)
4. Configure reverse proxy (nginx, Apache)
5. Set up monitoring and alerting

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 3000

CMD ["npm", "start"]
```

### Health Monitoring

Use the health endpoints for monitoring:

- **Basic health**: `/health` - Quick status check
- **Detailed health**: `/health/detailed` - Comprehensive system status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the health endpoints for service status
- Review logs for error details