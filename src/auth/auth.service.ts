import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UserService } from '../popo/user/user.service';
import { UserStatus } from '../popo/user/user.meta';
import { jwtConstants } from './constants';
import { JwtPayload } from './strategies/jwt.payload';
import { AuthLogger } from './auth.logger';
import * as ms from 'ms';
/**
 * retrieving a user and verifying the password.
 */

@Injectable()
export class AuthService {
  private readonly logger = new AuthLogger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      this.logger.warn('로그인 실패: 존재하지 않는 이메일', {
        '시도 이메일': email,
      });
      return null;
    }

    const cryptoSalt = user.cryptoSalt;

    if (user.userStatus == UserStatus.password_reset) {
      await this.usersService.updateUserStatus(user.uuid, UserStatus.activated);
    } else if (user.userStatus != UserStatus.activated) {
      this.logger.warn('로그인 실패: 비활성 계정', {
        이메일: email,
        '유저 UUID': user.uuid,
        '계정 상태': user.userStatus,
      });
      throw new UnauthorizedException('Not activated account.');
    }

    const encryptedPassword = this.encryptPassword(password, cryptoSalt);
    if (user.password === encryptedPassword) {
      const nickname = await this.usersService.getNickname(user.uuid);
      return { ...user, nickname: nickname.nickname };
    } else {
      this.logger.warn('로그인 실패: 비밀번호 불일치', {
        이메일: email,
        '유저 UUID': user.uuid,
      });
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
        this.logger.warn('토큰 갱신 실패: UUID 불일치', {
          'Access Token UUID': userInAccessToken.uuid,
          'Refresh Token UUID': userInRefreshToken.uuid,
          이메일: userInAccessToken.email,
        });
        return false;
      }

      // 3. DB에 저장된 해시된 리프레시 토큰과 일치하는지 검증
      const user = await this.usersService.findOneByUuid(
        userInAccessToken.uuid,
      );

      if (!user) {
        this.logger.warn('토큰 갱신 실패: 존재하지 않는 유저', {
          '유저 UUID': userInAccessToken.uuid,
          이메일: userInAccessToken.email,
        });
        return false;
      }

      const hashedToken = this.hashToken(refreshToken);

      if (!user.hashedRefreshToken || user.hashedRefreshToken !== hashedToken) {
        this.logger.warn('토큰 갱신 실패: Refresh Token 해시 불일치', {
          '유저 UUID': userInAccessToken.uuid,
          이메일: userInAccessToken.email,
          'DB에 토큰 존재 여부': !!user.hashedRefreshToken,
        });
        return false;
      }

      // 4. 토큰 만료 시간 검증
      if (
        !user.refreshTokenExpiresAt ||
        user.refreshTokenExpiresAt <= new Date()
      ) {
        this.logger.warn('토큰 갱신 실패: Refresh Token 만료', {
          '유저 UUID': userInAccessToken.uuid,
          이메일: userInAccessToken.email,
          '만료 시각': user.refreshTokenExpiresAt?.toISOString(),
        });
        return false;
      }

      return true;
    } catch (error) {
      // 토큰 검증 실패 (만료되었거나 서명이 잘못된 경우)
      this.logger.warn('토큰 갱신 실패: Refresh Token 서명 검증 실패', {
        '유저 UUID': userInAccessToken.uuid,
        이메일: userInAccessToken.email,
        에러: error.message,
      });
      return false;
    }
  }

  // 만료된 access token을 디코딩하는 메서드 (refresh 엔드포인트용)
  decodeExpiredAccessToken(accessToken: string): JwtPayload | null {
    try {
      // ignoreExpiration: true로 설정하여 만료된 토큰도 디코딩
      const payload = this.jwtService.verify(accessToken, {
        secret: jwtConstants.accessTokenSecret,
        ignoreExpiration: true,
      });

      return {
        uuid: payload.uuid,
        email: payload.email,
        name: payload.name,
        nickname: payload.nickname,
        userType: payload.userType,
      };
    } catch (error) {
      this.logger.warn('Access Token 디코딩 실패', {
        에러: error.message,
      });
      return null;
    }
  }
}
