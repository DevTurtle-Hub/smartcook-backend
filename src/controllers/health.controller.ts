import { Request, Response, NextFunction } from "express";
import { HealthService } from "../services/health.service";
import { ok } from "../utils/response";

export class HealthController {
  public static checkHealth(req: Request, res: Response, next: NextFunction): void {
    try {
      const data = HealthService.getHealthStatus();
      ok(res, data, "SmartCook Backend is healthy and running");
    } catch (error) {
      next(error);
    }
  }
}
