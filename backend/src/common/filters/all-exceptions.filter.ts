import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Converts every error to a consistent JSON shape `{ statusCode, code, message, errors? }`
 * and never leaks stack traces or internal details to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const payload =
        typeof body === 'string'
          ? { message: body }
          : (body as { message?: string | string[]; code?: string; errors?: unknown });
      const isValidation = Array.isArray(payload.message);
      response.status(status).json({
        statusCode: status,
        code: payload.code ?? (isValidation ? 'VALIDATION_ERROR' : HttpStatus[status]),
        message: isValidation ? 'Validation failed' : (payload.message ?? 'Error'),
        ...(isValidation ? { errors: payload.message } : {}),
        ...(payload.errors ? { errors: payload.errors } : {}),
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        response.status(409).json({ statusCode: 409, code: 'CONFLICT', message: 'Resource already exists' });
        return;
      }
      if (exception.code === 'P2025') {
        response.status(404).json({ statusCode: 404, code: 'NOT_FOUND', message: 'Resource not found' });
        return;
      }
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response
      .status(500)
      .json({ statusCode: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
}
