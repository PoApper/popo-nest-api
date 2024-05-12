import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../popo/user/user.service';
import { ReservePlaceService } from '../popo/reservation/place/reserve.place.service';
import { ReserveEquipService } from '../popo/reservation/equip/reserve.equip.service';
import { MailService } from 'src/mail/mail.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { UserStatus } from 'src/popo/user/user.meta';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: DeepMocked<AuthService>;
  let userService: DeepMocked<UserService>;
  let reservePlaceService: DeepMocked<ReservePlaceService>;
  let reserveEquipService: DeepMocked<ReserveEquipService>;
  let mailService: DeepMocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: createMock<AuthService>(),
        },
        {
          provide: UserService,
          useValue: createMock<UserService>(),
        },
        {
          provide: ReservePlaceService,
          useValue: createMock<ReservePlaceService>(),
        },
        {
          provide: ReserveEquipService,
          useValue: createMock<ReserveEquipService>(),
        },
        {
          provide: MailService,
          useValue: createMock<MailService>(),
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    userService = module.get(UserService);
    reservePlaceService = module.get(ReservePlaceService);
    reserveEquipService = module.get(ReserveEquipService);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
    expect(reservePlaceService).toBeDefined();
    expect(reserveEquipService).toBeDefined();
    expect(mailService).toBeDefined();
  });

  it('should reject unauthorized admin user', async () => {
    const req = {
      path: 'admin',
      user: {
        userType: ['user'],
      },
    };
    await expect(controller.verifyToken(req as any)).rejects.toThrow();
  });

  it('should verify token and return user', async () => {
    const req = {
      path: 'me',
      user: {
        uuid: '1',
      },
    };
    await expect(controller.verifyToken(req as any)).resolves.toEqual(req.user);
  });

  it('should get own reservations', async () => {
    const req = {
      user: {
        uuid: '1',
        email: 'email',
      },
    };
    const user = req.user;
    userService.findOneByEmail.mockResolvedValue(user as any);
    const placeReserve = [{ uuid: '1' }];
    const equipReserve = [{ uuid: '1' }];
    reservePlaceService.find.mockResolvedValue(placeReserve as any);
    reserveEquipService.find.mockResolvedValue(equipReserve as any);
    await expect(controller.getOwnReservations(req as any)).resolves.toEqual({
      place_reservation: placeReserve,
      equip_reservation: equipReserve,
    });
  });

  // TODO: Test login

  // TODO: Test logout

  it('should register user if verification mail has been sent successfully', async () => {
    const req = {
      body: {
        email: 'email',
        password: 'password',
        name: 'name',
      },
    };
    const user = req.body;
    userService.save.mockResolvedValue(user as any);
    mailService.sendVerificationMail.mockResolvedValue(undefined);
    await expect(controller.register(req as any)).resolves.toEqual(user);
  });

  it('should throw error if verification mail has not been sent successfully', async () => {
    const req = {
      body: {
        email: 'email',
        password: 'password',
        name: 'name',
      },
    };
    const user = req.body;
    userService.save.mockResolvedValue(user as any);
    mailService.sendVerificationMail.mockRejectedValue(
      new BadRequestException(),
    );
    await expect(controller.register(req as any)).rejects.toThrow();
  });

  it('should throw error if user does not exist', async () => {
    const req = {
      body: {
        email: 'email',
      },
    };
    userService.findOneByEmail.mockResolvedValue(undefined);
    await expect(controller.resetPassword(req as any)).rejects.toThrow();
  });

  it('should throw error if user status is password_reset', async () => {
    const req = {
      body: {
        email: 'email',
      },
    };
    const user = {
      userStatus: UserStatus.password_reset,
    };
    userService.findOneByEmail.mockResolvedValue(user as any);
    await expect(controller.resetPassword(req as any)).rejects.toThrow();
  });

  it('should reset password', async () => {
    const req = {
      body: {
        email: 'email',
      },
    };
    const user = {
      uuid: '1',
    };
    userService.findOneByEmail.mockResolvedValue(user as any);
    userService.updatePasswordByEmail.mockResolvedValue(undefined);
    userService.updateUserStatus.mockResolvedValue(undefined);
    mailService.sendPasswordResetMail.mockResolvedValue(undefined);
    await expect(controller.resetPassword(req as any)).resolves.not.toThrow();
  });

  it('should return user informatio', async () => {
    const req = {
      user: {
        uuid: '1',
      },
    };
    const userInfo = {
      email: 'email',
      name: 'name',
      userType: 'user',
      userStatus: 'activated',
    };
    userService.findOneByUuid.mockResolvedValue(userInfo as any);
    await expect(controller.getMyInfo(req as any)).resolves.toEqual(userInfo);
  });
});
