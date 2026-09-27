import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { UserService } from '../popo/user/user.service';
import { UserController } from '../popo/user/user.controller';
import { User } from '../popo/user/user.entity';
import { Nickname } from '../popo/user/nickname.entity';
import { SettingService } from '../popo/setting/setting.service';
import { UserStatus, UserType } from '../popo/user/user.meta';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtPayload } from './strategies/jwt.payload';
import { jwtConstants } from './constants';
import { AuthService } from './auth.service';
import { UpdateUserDto } from '../popo/user/user.dto';

describe('Public registration privilege boundary', () => {
  const repository = createMock<Repository<User>>();
  const settings = createMock<SettingService>();
  const users = new UserService(
    repository,
    settings,
    createMock<Repository<Nickname>>(),
  );
  const dto = {
    email: 'student@example.com',
    password: 'password',
    name: 'Student',
    userType: UserType.admin,
  };
  beforeEach(() => {
    jest.resetAllMocks();
    repository.findOneBy.mockResolvedValue(null);
    repository.save.mockImplementation(async (user) => user as User);
    settings.checkRcStudent.mockResolvedValue(false);
  });
  it.each([
    UserType.admin,
    UserType.staff,
    UserType.association,
    UserType.club,
  ])(
    'does not persist public callers requested role %s or status',
    async (userType) => {
      const input = { ...dto, userType, userStatus: UserStatus.activated };
      const saved = await users.register(input);
      expect(saved.userType).toBe(UserType.student);
      expect(saved.userStatus).toBe(UserStatus.deactivated);
    },
  );
  it('uses the server RC membership check rather than the submitted role', async () => {
    settings.checkRcStudent.mockResolvedValue(true);
    expect((await users.register(dto)).userType).toBe(UserType.rc_student);
  });
  it('preserves the separate administrator provisioning flow', async () => {
    expect((await users.save(dto)).userType).toBe(UserType.admin);
  });
  it.each([{ userType: UserType.student }, { userStatus: UserStatus.banned }])(
    'revokes refresh sessions when administrator changes %j',
    async (patch) => {
      repository.findOneByOrFail.mockResolvedValue(
        Object.assign(new User(), {
          uuid: 'user',
          email: dto.email,
          userType: UserType.admin,
          userStatus: UserStatus.activated,
        }),
      );
      await users.update('user', patch as UpdateUserDto);
      expect(repository.update).toHaveBeenCalledWith(
        { uuid: 'user', email: dto.email },
        expect.objectContaining({
          hashedRefreshToken: null,
          refreshTokenExpiresAt: null,
        }),
      );
    },
  );
});

describe('User administration authorization', () => {
  let app: INestApplication;
  const update = jest.fn().mockResolvedValue({});
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: { update } }],
    }).compile();
    app = module.createNestApplication();
    app.use((req, _res, next) => {
      req.user = { userType: req.headers['x-test-role'] };
      next();
    });
    await app.init();
  });
  afterAll(async () => app?.close());
  it.each([UserType.student, UserType.staff, `NOT_${UserType.admin}`, ''])(
    'rejects privilege changes from %s',
    async (role) => {
      await request(app.getHttpServer())
        .put('/user/target')
        .set('x-test-role', role)
        .send({ userType: UserType.admin })
        .expect(403);
      expect(update).not.toHaveBeenCalled();
    },
  );
  it('allows administrators to manage roles', async () => {
    await request(app.getHttpServer())
      .put('/user/target')
      .set('x-test-role', UserType.admin)
      .send({ userType: UserType.staff })
      .expect(200);
    expect(update).toHaveBeenCalledWith('target', { userType: UserType.staff });
  });
});

describe('Current account authority overrides stale token privileges', () => {
  const users = createMock<UserService>();
  const jwt = new JwtService();
  let strategy: JwtStrategy;
  let auth: AuthService;
  const payload: JwtPayload = {
    uuid: 'user',
    name: 'User',
    email: 'user@example.com',
    nickname: null,
    userType: UserType.admin,
  };
  const original = { ...jwtConstants };
  beforeAll(() => {
    jwtConstants.accessTokenSecret = 'access-test-secret';
    jwtConstants.refreshTokenSecret = 'refresh-test-secret';
  });
  afterAll(() => Object.assign(jwtConstants, original));
  beforeEach(() => {
    jest.resetAllMocks();
    strategy = new JwtStrategy(users);
    auth = new AuthService(users, jwt);
  });
  it('uses the DB role when an old signed ADMIN token belongs to a demoted user', async () => {
    users.findOneByUuid.mockResolvedValue(
      Object.assign(new User(), {
        ...payload,
        userType: UserType.student,
        userStatus: UserStatus.activated,
      }),
    );
    const token = jwt.sign(payload, { secret: jwtConstants.accessTokenSecret });
    const claims = jwt.verify<JwtPayload>(token, {
      secret: jwtConstants.accessTokenSecret,
    });
    expect((await strategy.validate(claims)).userType).toBe(UserType.student);
  });
  it.each([
    UserStatus.deactivated,
    UserStatus.banned,
    UserStatus.password_reset,
    null,
  ])(
    'rejects access tokens for unavailable account state %s',
    async (status) => {
      users.findOneByUuid.mockResolvedValue(
        status
          ? Object.assign(new User(), { ...payload, userStatus: status })
          : null,
      );
      await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    },
  );
  it.each([
    [UserType.admin, UserStatus.activated, true],
    [UserType.student, UserStatus.activated, false],
    [UserType.admin, UserStatus.banned, false],
  ])(
    'validates refresh against current role %s and status %s',
    async (role, status, expected) => {
      const token = jwt.sign(payload, {
        secret: jwtConstants.refreshTokenSecret,
      });
      users.findOneByUuid.mockResolvedValue(
        Object.assign(new User(), {
          ...payload,
          userType: role,
          userStatus: status,
          hashedRefreshToken: auth.hashToken(token),
          refreshTokenExpiresAt: new Date(Date.now() + 60_000),
        }),
      );
      expect(await auth.validateRefreshToken(payload, token)).toBe(expected);
    },
  );
});
