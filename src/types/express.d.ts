import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      token?: string; // Custom token property
      decoded?: string | JwtPayload; // Decoded JWT property
    }
  }
}
