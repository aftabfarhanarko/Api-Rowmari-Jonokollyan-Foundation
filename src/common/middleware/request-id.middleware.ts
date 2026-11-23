import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerName = 'x-request-id';
    const requestId = (req.headers[headerName] as string) || `req_${uuidv4().replace(/-/g, '')}`;
    req.requestId = requestId;
    res.setHeader(headerName, requestId);
    next();
  }
}
