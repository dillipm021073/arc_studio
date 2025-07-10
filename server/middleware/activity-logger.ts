import { storage } from "../storage";
import { Request, Response, NextFunction } from "express";

// Sanitize request body to remove sensitive data
function sanitizeRequestBody(body: any): string | null {
  if (!body || Object.keys(body).length === 0) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return JSON.stringify(sanitized);
}

// Extract resource and action from endpoint
function extractResourceAndAction(method: string, endpoint: string): { resource?: string; action?: string; resourceId?: number } {
  const pathParts = endpoint.split('/').filter(p => p);
  
  // Skip 'api' prefix
  if (pathParts[0] === 'api') {
    pathParts.shift();
  }
  
  const resource = pathParts[0];
  const hasId = pathParts[1] && /^\d+$/.test(pathParts[1]);
  const resourceId = hasId ? parseInt(pathParts[1]) : undefined;
  
  let action: string | undefined;
  
  switch (method) {
    case 'GET':
      action = 'read';
      break;
    case 'POST':
      action = 'create';
      break;
    case 'PUT':
    case 'PATCH':
      action = 'update';
      break;
    case 'DELETE':
      action = 'delete';
      break;
  }
  
  return { resource, action, resourceId };
}

// Activity logging middleware
export function activityLogger(req: Request & { user?: any }, res: Response, next: NextFunction) {
  // Skip logging for non-API routes
  if (!req.originalUrl.startsWith('/api/')) {
    return next();
  }
  
  // Skip logging for auth check endpoints
  if (req.originalUrl === '/api/auth/me') {
    return next();
  }
  
  const startTime = Date.now();
  
  // Capture original send function
  const originalSend = res.send;
  
  // Override send function to log activity
  res.send = function(data: any) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log activity if user is authenticated
    if (req.user) {
      const { resource, action, resourceId } = extractResourceAndAction(req.method, req.originalUrl);
      
      storage.createUserActivityLog({
        userId: req.user.id,
        username: req.user.username,
        activityType: 'api_call',
        method: req.method,
        endpoint: req.originalUrl,
        resource,
        resourceId,
        action,
        statusCode: res.statusCode,
        errorMessage: res.statusCode >= 400 ? data?.message || 'Error' : undefined,
        requestBody: ['POST', 'PUT', 'PATCH'].includes(req.method) ? sanitizeRequestBody(req.body) : null,
        responseTime,
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: null
      }).catch(error => {
        console.error('Failed to log user activity:', error);
      });
    }
    
    // Call original send function
    return originalSend.call(this, data);
  };
  
  next();
}