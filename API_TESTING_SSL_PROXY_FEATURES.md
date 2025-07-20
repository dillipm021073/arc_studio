# API Testing - SSL/TLS and Proxy Features

## Overview

The API Test Tool in the Interface Builder now includes advanced features for handling SSL/TLS certificates and proxy configurations, similar to popular API testing tools like Postman.

## Features Added

### 1. SSL/TLS Certificate Verification

- **Skip SSL Certificate Verification**: Toggle option to bypass SSL certificate validation
- **Use Case**: Testing against development servers with self-signed certificates
- **Location**: Settings tab in the API Test Dialog
- **Warning**: Only use this option for testing environments, never in production

### 2. Proxy Configuration

Complete proxy support with the following options:

- **Proxy URL**: Configure HTTP/HTTPS proxy server
- **Proxy Authentication**: Username and password support
- **No-Proxy Hosts**: Comma-separated list of hosts that bypass the proxy
  - Supports exact matches: `localhost, 127.0.0.1`
  - Supports wildcard patterns: `*.local, *.internal.com`

## How to Use

### Accessing the Settings

1. Open the API Test Tool from the Interface Builder
2. Navigate to the "Settings" tab
3. Configure SSL and/or proxy settings as needed

### SSL Certificate Bypass

1. In the Settings tab, check "Skip SSL certificate verification"
2. A warning will appear reminding you this is insecure
3. Your requests will now accept self-signed or invalid certificates

### Proxy Configuration

1. In the Settings tab, check "Use proxy server"
2. Enter your proxy URL (e.g., `http://proxy.company.com:8080`)
3. If authentication is required:
   - Enter proxy username
   - Enter proxy password
4. Configure no-proxy hosts if certain domains should bypass the proxy

## Technical Implementation

### Backend Changes

The `/api/interface-builder/test-api` endpoint now supports:

```typescript
{
  method: string,
  url: string,
  headers: object,
  body: any,
  protocol: string,
  insecureSkipVerify: boolean,
  proxy: {
    url: string,
    auth: {
      username: string,
      password: string
    },
    noProxy: string[]
  }
}
```

### Security Considerations

- SSL bypass is only for development/testing
- Proxy credentials are sent securely to the backend
- The backend validates all URLs to prevent SSRF attacks
- Production environments block localhost testing

## Saved Requests

All SSL and proxy settings are saved with your API requests in collections, making it easy to maintain different configurations for different environments.

## Future Enhancements

- Environment-specific proxy configurations
- Certificate pinning support
- SOCKS proxy support
- Custom CA certificate upload