import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "../utils/errors";

export const validate = (
  schema: Joi.ObjectSchema,
  property: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(", ");
      next(new AppError(errorMessage, 400));
      return;
    }

    req[property] = value;
    next();
  };
};

export default validate;
