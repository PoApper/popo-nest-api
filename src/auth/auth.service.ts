import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../popo/user/user.service';
import { UserStatus } from '../popo/user/user.meta';
import { encryptWord } from '../utils/encrypt-utils';

/**
 * retrieving a user and verifying the password.
 */

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(id: string, password: string): Promise<any> {
    const user = await this.usersService.findOneById(id);
    if (user) {
      const cryptoSalt = user.cryptoSalt;

      if (user.userStatus != UserStatus.activated) {
        throw new UnauthorizedException('Not activated account.');
      }

      const encryptedPassword = encryptWord(password, cryptoSalt);
      if (user.password === encryptedPassword) {
        const { password, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async generateJwtToken(user: any) {
    const payload = {
      uuid: user.uuid,
      id: user.id,
      name: user.name,
      userType: user.userType,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}
