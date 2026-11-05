import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { Request } from 'express';
import { JwtPayload } from './jwt.payload';
import { UserService } from '../../popo/user/user.service';
import { UserStatus } from '../../popo/user/user.meta';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.accessTokenSecret,
    });
  }

  // only can access properties described in `generateJwtToken()` function
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.uuid) throw new UnauthorizedException();
    const user = await this.usersService.findOneByUuid(payload.uuid);
    if (!user || user.userStatus !== UserStatus.activated) {
      throw new UnauthorizedException();
    }
    return {
      uuid: user.uuid,
      name: user.name,
      nickname: payload.nickname,
      userType: user.userType,
      email: user.email,
    };
    // this is what you can access by `@Req() req` with `@JwtAuthGuard` decorator
  }
}
