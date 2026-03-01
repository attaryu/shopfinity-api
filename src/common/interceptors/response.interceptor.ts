import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponse } from '../types/api-response';
import { ControllerResponse } from '../types/controller-response';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const controllerResponse = data as ControllerResponse<T>;

        return {
          success: true,
          statusCode: response.statusCode,
          message: controllerResponse.message ?? 'Operation successful',
          data: controllerResponse.data,
          error: null,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
