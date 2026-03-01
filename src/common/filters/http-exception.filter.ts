import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { ApiResponse } from '../types/api-response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: string | string[] | Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      statusCode = exception.getStatus();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, string>;

        message = responseObj.message || message;
        errorDetails = responseObj.message;

        // Handle validation errors from class-validator
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          errorDetails = responseObj.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = exception.stack;
    }

    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      data: null,
      error: {
        type: exception instanceof HttpException ? exception.name : 'Error',
        details: errorDetails,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    } satisfies ApiResponse);
  }
}
