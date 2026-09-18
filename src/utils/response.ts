import { Response } from "express";

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: any;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message: string = "Success",
    statusCode: number = 200,
    meta?: PaginationMeta
  ): Response {
    const responseBody: StandardApiResponse<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = "Resource created successfully"
  ): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string = "An error occurred",
    statusCode: number = 400,
    errors?: any
  ): Response {
    const responseBody: StandardApiResponse = {
      success: false,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }
}

// Backward compatibility helpers
export const ok = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  status: number = 200
): Response => {
  return ApiResponse.success(res, data, message, status);
};

export const fail = (
  res: Response,
  message: string = "Error",
  status: number = 400,
  errors: any = null
): Response => {
  return ApiResponse.error(res, message, status, errors);
};

export default ApiResponse;
