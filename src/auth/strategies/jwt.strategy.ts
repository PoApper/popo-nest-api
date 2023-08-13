import { Injectable } from '@nestjs/common';
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
          return request?.cookies?.Authentication;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  // only can access properties described in `generateJwtToken()` function
  validate(payload: any): JwtPayload {
    return {
      uuid: payload.uuid,
      name: payload.name,
      userType: payload.userType,
      email: payload.email,
    };
    // this is what you can access by `@Req() req` with `@JwtAuthGuard` decorator
  }
}
