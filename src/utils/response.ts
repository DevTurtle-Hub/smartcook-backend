import { Response } from "express";

export const ok = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  status: number = 200
): Response => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const fail = (
  res: Response,
  message: string = "Error",
  status: number = 400,
  errors: any = null
): Response => {
  return res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};
