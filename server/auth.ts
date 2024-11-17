import { auth } from "express-oauth2-jwt-bearer";
import { type Express } from "express";

export function setupAuth(app: Express) {
  const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    tokenSigningAlg: "RS256"
  });

  // Do not apply JWT check globally
  // Instead, return the middleware to be applied to protected routes
  return jwtCheck;
}