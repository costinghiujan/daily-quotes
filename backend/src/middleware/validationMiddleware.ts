import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError, FieldValidationError } from 'express-validator';

/**
 * Middleware to check validation results from express-validator schemas
 * Returns 400 with detailed error messages if validation fails
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'error',
      message: 'Date invalide',
      errors: errors.array().map((err: ValidationError) => {
        let field = 'unknown';
        if (err.type === 'field') {
          field = (err as FieldValidationError).path;
        }
        return {
          field,
          message: err.msg,
        };
      }),
    });
    return;
  }
  next();
};
