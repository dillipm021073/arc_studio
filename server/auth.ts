import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import crypto from "crypto";

// Simple password hashing (in production, use bcrypt or argon2)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Configure passport
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      const hashedPassword = hashPassword(password);
      const validPassword = await storage.validateUserPassword(user.id, hashedPassword);
      
      if (!validPassword) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export function setupAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication routes
  app.post('/api/auth/login', 
    passport.authenticate('local'),
    async (req, res) => {
      const user = req.user as any;
      
      // Log login activity
      try {
        await storage.createUserActivityLog({
          userId: user.id,
          username: user.username,
          activityType: 'login',
          method: 'POST',
          endpoint: '/api/auth/login',
          statusCode: 200,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ loginTime: new Date() })
        });
      } catch (error) {
        console.error('Failed to log login activity:', error);
      }
      
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }
  );

  app.post('/api/auth/logout', async (req, res) => {
    const user = req.user as any;
    
    // Log logout activity before destroying session
    if (user) {
      try {
        await storage.createUserActivityLog({
          userId: user.id,
          username: user.username,
          activityType: 'logout',
          method: 'POST',
          endpoint: '/api/auth/logout',
          statusCode: 200,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ logoutTime: new Date() })
        });
      } catch (error) {
        console.error('Failed to log logout activity:', error);
      }
    }
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ 
      user: {
        id: (req.user as any).id,
        username: (req.user as any).username,
        email: (req.user as any).email,
        name: (req.user as any).name,
        role: (req.user as any).role
      }
    });
  });

  // Get current user details including AutoX settings
  app.get('/api/users/me', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { passwordHash, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user details' });
    }
  });

  // Update current user settings
  app.put('/api/users/me/settings', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { autoXApiKey, autoXUsername } = req.body;
      
      // Update only AutoX settings
      const updatedUser = await storage.updateUser(userId, {
        autoXApiKey,
        autoXUsername
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { passwordHash, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });
}

// Middleware to protect routes
export function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Middleware to require specific role (legacy - for backward compatibility)
export function requireRole(role: string) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if ((req.user as any).role !== role && (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

// Middleware to require specific permission
export function requirePermission(resource: string, action: string) {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const userId = (req.user as any).id;
      
      // Check if user has Admin role - admins bypass all permission checks
      const userRoles = await storage.getUserRolesWithDetails(userId);
      const isAdmin = userRoles.some(ur => ur.role.name === 'Admin');
      
      if (isAdmin) {
        next();
        return;
      }
      
      // Check specific permissions for non-admin users
      const permissions = await storage.getUserPermissions(userId);
      
      const hasPermission = permissions.some(
        p => p.resource === resource && p.action === action
      );

      if (!hasPermission) {
        // Log permission denied
        await storage.createUserActivityLog({
          userId,
          username: (req.user as any).username,
          activityType: 'permission_denied',
          method: req.method,
          endpoint: req.originalUrl,
          resource,
          action,
          statusCode: 403,
          errorMessage: 'Insufficient permissions',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ required: { resource, action } })
        });
        
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: { resource, action }
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Failed to verify permissions' });
    }
  };
}

// Middleware to check any of multiple permissions
export function requireAnyPermission(...permissions: [string, string][]) {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const userId = (req.user as any).id;
      
      // Check if user has Admin role - admins bypass all permission checks
      const userRoles = await storage.getUserRolesWithDetails(userId);
      const isAdmin = userRoles.some(ur => ur.role.name === 'Admin');
      
      if (isAdmin) {
        next();
        return;
      }
      
      // Check permissions for non-admin users
      const userPermissions = await storage.getUserPermissions(userId);
      
      const hasAnyPermission = permissions.some(([resource, action]) =>
        userPermissions.some(p => p.resource === resource && p.action === action)
      );

      if (!hasAnyPermission) {
        // Log permission denied
        await storage.createUserActivityLog({
          userId,
          username: (req.user as any).username,
          activityType: 'permission_denied',
          method: req.method,
          endpoint: req.originalUrl,
          statusCode: 403,
          errorMessage: 'Insufficient permissions',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ required: permissions.map(([resource, action]) => ({ resource, action })) })
        });
        
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: permissions.map(([resource, action]) => ({ resource, action }))
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Failed to verify permissions' });
    }
  };
}