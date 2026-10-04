import { Request, Response, NextFunction } from "express";

/**
 * Recursively sanitize an object by removing or cleaning keys starting with '$' or containing '.'
 */
const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleanObj: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    // Block or strip prohibited MongoDB operators ($gt, $ne, $where) and dots
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    cleanObj[key] = sanitizeObject(obj[key]);
  }

  return cleanObj;
};

/**
 * Middleware: NoSQL Injection Sanitizer
 * Removes dangerous MongoDB operators from req.body, req.query, and req.params
 */
export const mongoSanitize = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }

  if (req.query && typeof req.query === "object") {
    // In Express 5, req.query can be a getter or object, sanitize safely
    try {
      const sanitized = sanitizeObject(req.query);
      for (const key of Object.keys(req.query)) {
        if (key.startsWith("$") || key.includes(".")) {
          delete (req.query as any)[key];
        }
      }
      Object.assign(req.query, sanitized);
    } catch {
      // ignore
    }
  }

  next();
};

/**
 * Middleware: HTTP Parameter Pollution (HPP) Protection
 * Prevents multiple duplicate query params from breaking string expectations,
 * while allowing legitimate array parameters in whitelist.
 */
export const hppProtection = (whitelist: string[] = ["tags", "cuisines", "restrictions", "tasteProfile"]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.query || typeof req.query !== "object") {
      return next();
    }

    const whitelistSet = new Set(whitelist);

    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value) && !whitelistSet.has(key)) {
        // If not whitelisted for array values, take the last parameter string
        (req.query as any)[key] = value[value.length - 1];
      }
    }

    next();
  };
};
