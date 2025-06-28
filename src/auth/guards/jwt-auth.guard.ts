import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        error: 'AccessTokenExpired',
        message: 'Access token has expired. Please use refresh token.',
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        error: 'Unauthorized',
        message: 'Invalid or missing access token.',
      });
    }

    return user;
  }
}
