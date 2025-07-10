import { Request, Response, NextFunction } from 'express';

export function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id;
  
  if (!id) {
    return res.status(400).json({ message: "ID parameter is required" });
  }
  
  const parsedId = parseInt(id);
  
  if (isNaN(parsedId) || parsedId < 1) {
    return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
  }
  
  // Store the parsed ID for use in route handlers
  req.params.parsedId = parsedId.toString();
  
  next();
}

export function parseIdParam(id: string): number | null {
  const parsed = parseInt(id);
  if (isNaN(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}