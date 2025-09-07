# Configuration Guide

## Environment Variables

Create a `.env` file in the `FitAuraApp` directory with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Environment
VITE_NODE_ENV=development
```

## Production Configuration

For production, update the environment variables:

```bash
# Production API Configuration
VITE_API_BASE_URL=https://your-api-domain.com

# Environment
VITE_NODE_ENV=production
```

## API Configuration

The application uses a centralized configuration system located in `src/config/api.ts`:

- **API_ENDPOINTS**: All API endpoints are defined here
- **API_CONFIG**: Configuration for timeouts, retry attempts, etc.
- **ENV_CONFIG**: Environment-specific settings

## Benefits of This Approach

1. **No Hardcoded URLs**: All API calls use the configuration system
2. **Environment Flexibility**: Easy to switch between development and production
3. **Centralized Management**: All API endpoints in one place
4. **Type Safety**: TypeScript interfaces for all API responses
5. **Error Handling**: Consistent error handling across the application
6. **Timeout Configuration**: Configurable request timeouts
7. **Retry Logic**: Built-in retry mechanisms for failed requests

## Usage

The API service is automatically configured based on environment variables:

```typescript
import { apiService } from '../services/api';

// All API calls use the configured base URL
const insights = await apiService.getInsights(userId, 7, true);
const profile = await apiService.getProfile(userId);
const logs = await apiService.getLogs(userId);
```
