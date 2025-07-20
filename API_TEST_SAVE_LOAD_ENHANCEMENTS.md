# API Test Save/Load Enhancements

## Overview

Enhanced the API Test Tool to properly save and restore all request configuration data when saving to collections and loading saved requests.

## Changes Made

### 1. Database Schema Updates

Added new fields to `api_test_requests` table:
- `protocol` (VARCHAR) - Stores HTTP/HTTPS/SOAP protocol
- `content_type` (VARCHAR) - Stores the content type for request body
- `settings` (JSONB) - Stores SSL and proxy configuration

### 2. Save Request Enhancements

The save request now captures ALL tab data:
- **Params Tab**: Query parameters with enabled state
- **Headers Tab**: All headers with enabled state
- **Auth Tab**: Authentication type and credentials
- **Body Tab**: Request body and content type
- **Tests Tab**: Test scripts
- **Settings Tab**: SSL bypass and proxy configuration

### 3. Load Request Enhancements

When loading a saved request, ALL data is restored:
- Protocol selection (HTTP/HTTPS/SOAP)
- Method (GET, POST, etc.)
- URL
- Query parameters
- Headers
- Authentication settings
- Request body and content type
- Test scripts
- SSL certificate verification settings
- Proxy configuration including:
  - Proxy URL
  - Proxy authentication
  - No-proxy hosts

### 4. Data Structure

Settings are saved in the following format:
```json
{
  "settings": {
    "insecureSkipVerify": true,
    "useProxy": true,
    "proxyUrl": "http://proxy.company.com:8080",
    "proxyAuth": {
      "username": "user",
      "password": "pass"
    },
    "noProxyHosts": "localhost, *.local"
  }
}
```

## Benefits

1. **Complete State Restoration**: Users can save complex API configurations and restore them exactly as saved
2. **Environment-Specific Settings**: Different SSL and proxy settings can be saved per request
3. **Team Collaboration**: Team members can share complete API test configurations
4. **Faster Testing**: No need to reconfigure settings each time

## Usage

1. Configure your API request with all necessary settings
2. Click "Save" to save the request to a collection
3. The request will appear in the collection sidebar
4. Click on any saved request to load it - all settings will be restored
5. The Settings tab will show the saved SSL and proxy configuration

## Technical Implementation

- Frontend: React state management for all form fields
- Backend: PostgreSQL with JSONB columns for flexible data storage
- Migration scripts ensure backward compatibility