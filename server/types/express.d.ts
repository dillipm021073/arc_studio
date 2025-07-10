import { User } from '../../shared/schema';

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      name: string;
      role: string;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {};