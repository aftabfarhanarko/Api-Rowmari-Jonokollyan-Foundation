import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.requestId || 'req_unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred. Please try again later.';
    let details: any[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = this.getStatusCodeName(status);
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, any>;
        message = errorObj.message || exception.message;
        if (errorObj.error) {
          code = errorObj.error.toUpperCase().replace(/\s+/g, '_');
        }

        if (Array.isArray(errorObj.message)) {
          // Class validator error array
          details = errorObj.message.map((msg: string) => {
            const parts = msg.split(' ');
            return {
              field: parts[0] || 'input',
              message: msg,
            };
          });
          message = 'Validation failed for submitted data.';
          code = 'VALIDATION_FAILED';
        } else if (errorObj.details) {
          details = errorObj.details;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${requestId}] Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
      // Never expose SQL error or raw system error details in production
      code = 'INTERNAL_ERROR';
      message = 'An internal system error occurred.';
    }

    // Do not log tokens or sensitive payload in logs
    this.logger.warn(
      `[${requestId}] ${request.method} ${request.url} - Status: ${status} Code: ${code} Message: ${message}`,
    );

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
      },
    });
  }

  private getStatusCodeName(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }
}
