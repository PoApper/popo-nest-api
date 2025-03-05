import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { Request } from 'express';
import { JwtPayload } from './jwt.payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.Authentication;
          if (!token) {
            throw new UnauthorizedException('인증 토큰이 없습니다. 로그인이 필요합니다.');
          }
          if (token === '') {
            throw new UnauthorizedException('빈 인증 토큰이 제공되었습니다. 유효한 토큰이 필요합니다.');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  // only can access properties described in `generateJwtToken()` function
  validate(payload: any): JwtPayload {
    if (!payload) {
      throw new UnauthorizedException('유효하지 않은 토큰 페이로드입니다.');
    }

    return {
      uuid: payload.uuid,
      name: payload.name,
      userType: payload.userType,
      email: payload.email,
    };
    // this is what you can access by `@Req() req` with `@JwtAuthGuard` decorator
  }
}
