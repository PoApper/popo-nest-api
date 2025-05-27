import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UserService } from '../popo/user/user.service';
import { UserStatus } from '../popo/user/user.meta';
import { jwtConstants } from './constants';
import { JwtPayload } from './strategies/jwt.payload';
import * as ms from 'ms';
/**
 * retrieving a user and verifying the password.
 */

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return null;
    }

    const cryptoSalt = user.cryptoSalt;

    if (user.userStatus == UserStatus.password_reset) {
      await this.usersService.updateUserStatus(user.uuid, UserStatus.activated);
    } else if (user.userStatus != UserStatus.activated) {
      throw new UnauthorizedException('Not activated account.');
    }

    const encryptedPassword = this.encryptPassword(password, cryptoSalt);
    if (user.password === encryptedPassword) {
      const nickname = await this.usersService.getNickname(user.uuid);
      return { ...user, nickname: nickname.nickname };
    } else {
      return null;
    }
  }

  async generateAccessToken(user: JwtPayload) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      userType: user.userType,
    };
    return this.jwtService.sign(payload, {
      expiresIn: jwtConstants.accessTokenExpirationTime,
      secret: jwtConstants.accessTokenSecret,
    });
  }

  async generateRefreshToken(user: JwtPayload) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      userType: user.userType,
    };

    // const user_ = await this.usersService.findOneByUuid(user.uuid);
    // // if (user_.hashedRefreshToken && user_.refreshTokenExpiresAt > new Date()) {
    // //   return user_.hashedRefreshToken;
    // // }

    const token = this.jwtService.sign(payload, {
      expiresIn: jwtConstants.refreshTokenExpirationTime,
      secret: jwtConstants.refreshTokenSecret,
    });

    const hashedToken = this.hashToken(token);

    const expiresAt = new Date(
      Date.now() + ms(jwtConstants.refreshTokenExpirationTime),
    );

    await this.usersService.updateRefreshToken(
      user.uuid,
      hashedToken,
      expiresAt,
    );

    return token;
  }

  hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // password encrypt util
  private encryptPassword(password: string, cryptoSalt: string) {
    return crypto
      .pbkdf2Sync(password, cryptoSalt, 10000, 64, 'sha512')
      .toString('base64');
  }

  async validateRefreshToken(
    userInAccessToken: JwtPayload,
    refreshToken: string,
  ): Promise<boolean> {
    try {
      // 1. 리프레시 토큰이 유효한지 검증하고 payload 추출
      const userInRefreshToken = (await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: jwtConstants.refreshTokenSecret,
        },
      )) as JwtPayload;

      // 2. 리프레시 토큰의 payload가 액세스 토큰의 정보와 일치하는지 검증
      if (userInRefreshToken.uuid !== userInAccessToken.uuid) {
        return false;
      }

      // 3. DB에 저장된 해시된 리프레시 토큰과 일치하는지 검증
      const user = await this.usersService.findOneByUuid(
        userInAccessToken.uuid,
      );
      const hashedToken = this.hashToken(refreshToken);

      if (!user.hashedRefreshToken || user.hashedRefreshToken !== hashedToken) {
        return false;
      }

      // 4. 토큰 만료 시간 검증
      if (
        !user.refreshTokenExpiresAt ||
        user.refreshTokenExpiresAt <= new Date()
      ) {
        return false;
      }

      return true;
    } catch (error) {
      // 토큰 검증 실패 (만료되었거나 서명이 잘못된 경우)
      return false;
    }
  }
}
