import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const { method, url } = req;
    const now = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - Body: ${JSON.stringify(req.body)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(
          `Outgoing Response: ${method} ${url} ${res.statusCode} - ${delay}ms`,
        );
      }),
      catchError((err: Error) => {
        this.logger.error(
          `Error: ${method} ${url} - ${err.message}`,
          err.stack,
        );
        return throwError(() => err);
      }),
    );
  }
}
