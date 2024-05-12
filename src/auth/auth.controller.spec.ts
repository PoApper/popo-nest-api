import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../popo/user/user.service';
import { ReservePlaceService } from '../popo/reservation/place/reserve.place.service';
import { ReserveEquipService } from '../popo/reservation/equip/reserve.equip.service';
import { MailService } from 'src/mail/mail.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

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
});
