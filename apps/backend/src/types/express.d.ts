import { JwtPayload } from './dto.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
