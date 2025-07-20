# Important Learnings

## Node.js Fetch vs Node-Fetch for SSL/TLS Handling

### Problem
When implementing SSL certificate bypass functionality (equivalent to curl's `-k` flag), the native Node.js fetch API (undici) does not properly respect the `agent` option with SSL settings.

### Symptoms
- Error: "fetch failed" with cause "DEPTH_ZERO_SELF_SIGNED_CERT"
- Even when passing `agent: new https.Agent({ rejectUnauthorized: false })`
- Works with curl `-k` but not with native fetch

### Solution
Use `node-fetch` package instead of native fetch:

```typescript
import fetch from "node-fetch";
import https from "https";

// For SSL bypass
const agent = new https.Agent({
  rejectUnauthorized: false
});

// This works with node-fetch but NOT with native fetch
const response = await fetch(url, {
  method: 'GET',
  agent: agent
});
```

### Key Differences
1. **Native fetch (undici)**: Ignores the agent option for SSL settings
2. **node-fetch**: Properly respects the agent option and SSL configurations

### When This Matters
- Testing against development servers with self-signed certificates
- Implementing "Skip SSL verification" features in API testing tools
- Creating Postman-like functionality in Node.js applications

### Related Curl Commands
- `curl -k` : Skip SSL certificate verification
- `curl --noproxy <host>` : Bypass proxy for specific hosts

### Date Discovered
July 20, 2025

### Context
This was discovered while implementing SSL bypass and proxy features for the StudioArchitect Interface Builder API testing tool.