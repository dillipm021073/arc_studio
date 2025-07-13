export class LockConflictError extends Error {
  public readonly statusCode = 409;
  public readonly lockedBy: number;
  public readonly lockedByUser: string;
  public readonly initiativeId: string;
  public readonly lockExpiry?: Date;

  constructor(
    message: string,
    lockedBy: number,
    lockedByUser: string,
    initiativeId: string,
    lockExpiry?: Date
  ) {
    super(message);
    this.name = 'LockConflictError';
    this.lockedBy = lockedBy;
    this.lockedByUser = lockedByUser;
    this.initiativeId = initiativeId;
    this.lockExpiry = lockExpiry;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      lockedBy: this.lockedBy,
      lockedByUser: this.lockedByUser,
      initiativeId: this.initiativeId,
      expiresAt: this.lockExpiry
    };
  }
}