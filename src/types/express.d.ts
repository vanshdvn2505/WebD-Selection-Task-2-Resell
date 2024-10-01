import { JwtPayload } from "jsonwebtoken";

// Declaring a global augmentation for the Express namespace
declare global{
  namespace Express{
    // Extending the Request interface to include custom properties
    interface Request{
      token?: string; // Custom token property
      decoded?: string | JwtPayload; // Decoded JWT property
    }
  }
}
