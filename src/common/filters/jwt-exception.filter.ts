import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

@Catch(JsonWebTokenError, TokenExpiredError, NotBeforeError, UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.UNAUTHORIZED;
    let message = '인증에 실패했습니다';

    if (exception instanceof TokenExpiredError) {
      message = 'JWT 토큰이 만료되었습니다';
    } else if (exception instanceof JsonWebTokenError) {
      message = 'JWT 토큰이 유효하지 않습니다';
    } else if (exception instanceof NotBeforeError) {
      message = 'JWT 토큰이 아직 활성화되지 않았습니다';
    } else if (exception instanceof UnauthorizedException) {
      // 기본 UnauthorizedException에 메시지가 있으면 사용
      const exceptionResponse = (exception as any).response;
      if (exceptionResponse && exceptionResponse.message) {
        message = exceptionResponse.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}