import { ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '../popo/user/user.meta';
import { User } from '../popo/user/user.entity';
import { UserService } from '../popo/user/user.service';
import { JwtPayload } from '../auth/strategies/jwt.payload';

export class TestUtils {
  private testUser: User;
  private testAdmin: User;
  private testUserJwtToken: string;
  private testAdminJwtToken: string;
  private jwtAuthGuardSpy: jest.SpyInstance;
  private logger: Logger;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {
    this.logger = new Logger('TestUtils');
  }

  private createMockJwtAuthGuard = () => {
    return jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        // request.headers 이렇게 생김
        // request.headers:  {
        //   host: '127.0.0.1:62986',
        //   'accept-encoding': 'gzip, deflate',
        //   cookie: 'Authentication=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiM2E5NjIxN2MtMzJmYy00NjgzLWJiNmYtNmI0OGNiYjBmYjFjIiwibmFtZSI6ImFkbWluIiwibmlja25hbWUiOiIiLCJ1c2VyVHlwZSI6IkFETUlOIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsImlhdCI6MTc1MzQ1Nzk2OSwiZXhwIjoxNzUzNDYxNTY5fQ.oprOrhCRhwkx2m08fEbdW6xDnYQrKsAuusTx4SwEhp4',
        //   'content-type': 'application/json',
        //   'content-length': '123',
        //   connection: 'close'
        // }

        const cookie = request.headers?.cookie as string;
        let token = '';

        if (cookie && cookie.includes('Authentication=')) {
          token = cookie.split('Authentication=')[1];
        }

        if (!token) return false;

        try {
          const jwtService = new JwtService({
            secret: process.env.JWT_ACCESS_TOKEN_SECRET,
          });
          const decoded = jwtService.verify(token, {
            secret: process.env.JWT_ACCESS_TOKEN_SECRET,
          });

          request.user = decoded;
          return true;
        } catch (error) {
          this.logger.error('JWT decode error:', error);
          return false;
        }
      });
  };

  async initializeTestUsers() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);

    this.testUser = await this.userService.save({
      email: `test${timestamp}${randomSuffix}@test.com`,
      password: 'test',
      name: 'test',
      userType: UserType.student,
    });

    this.testAdmin = await this.userService.save({
      email: `admin${timestamp}${randomSuffix}@test.com`,
      password: 'test',
      name: 'admin',
      userType: UserType.admin,
    });

    const testUserPayload: JwtPayload = {
      uuid: this.testUser.uuid,
      name: this.testUser.name,
      nickname: '',
      userType: this.testUser.userType,
      email: this.testUser.email,
    };

    const testAdminPayload: JwtPayload = {
      uuid: this.testAdmin.uuid,
      name: this.testAdmin.name,
      nickname: '',
      userType: this.testAdmin.userType,
      email: this.testAdmin.email,
    };

    this.testUserJwtToken = this.jwtService.sign(testUserPayload, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });

    this.testAdminJwtToken = this.jwtService.sign(testAdminPayload, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
  }

  setupMocks() {
    this.jwtAuthGuardSpy = this.createMockJwtAuthGuard();
  }

  cleanup() {
    if (this.jwtAuthGuardSpy) {
      this.jwtAuthGuardSpy.mockRestore();
    }
  }

  getTestUser(): User {
    return this.testUser;
  }

  getTestAdmin(): User {
    return this.testAdmin;
  }

  getTestUserJwtToken(): string {
    return this.testUserJwtToken;
  }

  getTestAdminJwtToken(): string {
    return this.testAdminJwtToken;
  }
}
