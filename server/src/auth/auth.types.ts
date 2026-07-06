import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
  displayName: string;
  email: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
