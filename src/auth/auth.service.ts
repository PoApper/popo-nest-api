import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UserService } from '../popo/user/user.service';
import { UserStatus } from '../popo/user/user.meta';

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

  async generateAccessToken(user: any) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      userType: user.userType,
    };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: any) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
    };
    const token = this.jwtService.sign(payload, { expiresIn: '60d' });
    // TODO
    const hashedToken = '추가';
    const expiresAt = new Date(Date.now());
    await this.usersService.updateRefreshToken(
      user.uuid,
      hashedToken,
      expiresAt,
    );
    return token;
  }

  async removeRefreshToken(userUuid: string) {
    await this.usersService.updateRefreshToken(userUuid, null, null);
  }

  // password encrypt util
  private encryptPassword(password: string, cryptoSalt: string) {
    return crypto
      .pbkdf2Sync(password, cryptoSalt, 10000, 64, 'sha512')
      .toString('base64');
  }

  validateRefreshToken(userUuid: string, refreshToken: string): boolean {
    // TODO
    // 1. 리프레시 토큰이 엑세스 토큰의 정보와 일치하는지 검증
    // 2. 해싱한 리프레시 토큰이 DB에 저장된 리프레시 토큰과 일치하는지 검증
    // 일치하지 않는다면 토큰 악용되었을 가능성
    // 3. 일치한다면 토큰 만료 시간 검증
    return true;
  }
}
