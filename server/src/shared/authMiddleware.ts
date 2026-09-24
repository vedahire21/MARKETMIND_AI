import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from './jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token signature invalid or expired' });
  }
}

export function requireRole(roles: ('CUSTOMER' | 'SELLER' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User identity not found' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: `Role '${req.user.role}' is not authorized for this resource` });
    }

    next();
  };
}
