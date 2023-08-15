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

    if (user.userStatus != UserStatus.activated) {
      throw new UnauthorizedException('Not activated account.');
    }

    const encryptedPassword = this.encryptPassword(password, cryptoSalt);
    if (user.password === encryptedPassword) {
      const { password, ...result } = user;
      return result;
    } else {
      return null;
    }
  }



  async generateJwtToken(user: any) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      userType: user.userType,
    };
    return this.jwtService.sign(payload);
  }

  // password encrypt util
  private encryptPassword(password: string, cryptoSalt: string) {
    return crypto
      .pbkdf2Sync(password, cryptoSalt, 10000, 64, 'sha512')
      .toString('base64');
  }
}
