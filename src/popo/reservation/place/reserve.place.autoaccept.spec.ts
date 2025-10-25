import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { ReservePlaceModule } from './reserve.place.module';
import { ReservePlaceController } from './reserve.place.controller';
import { ReservePlaceService } from './reserve.place.service';
import { UserModule } from 'src/popo/user/user.module';
import { PlaceModule } from 'src/popo/place/place.module';
import { PlaceService } from 'src/popo/place/place.service';
import { PlaceEnableAutoAccept, PlaceRegion } from 'src/popo/place/place.meta';
import { TestUtils } from 'src/utils/test-utils';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { SettingService } from 'src/popo/setting/setting.service';
import { CreateReservePlaceDto } from './reserve.place.dto';
import { ReservationStatus } from '../reservation.meta';
import { UserService } from 'src/popo/user/user.service';
import { MailService } from 'src/mail/mail.service';

describe('ReservePlace - AutoAccept Concurrency (30-min granularity)', () => {
  let app: INestApplication;
  let reservePlaceController: ReservePlaceController;
  let reservePlaceService: ReservePlaceService;
  let placeService: PlaceService;
  let jwtService: JwtService;
  let userService: UserService;
  let mailService: MailService;
  let testUtils: TestUtils;

  let testUserJwt: JwtPayload;
  let placeAuto: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [configurations], envFilePath: ['.env.test'] }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => configService.get('database'),
        }),
        JwtModule.register({ secret: 'SECRET', signOptions: { expiresIn: '1h' } }),
        ReservePlaceModule,
        UserModule,
        PlaceModule,
      ],
    })
      .overrideProvider(SettingService)
      .useValue({ checkRcStudent: jest.fn().mockResolvedValue(false) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    reservePlaceController = moduleFixture.get<ReservePlaceController>(ReservePlaceController);
    reservePlaceService = moduleFixture.get<ReservePlaceService>(ReservePlaceService);
    placeService = moduleFixture.get<PlaceService>(PlaceService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userService = moduleFixture.get<UserService>(UserService);
    mailService = moduleFixture.get<MailService>(MailService);
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);

    testUtils = new TestUtils(userService, jwtService);
    await testUtils.initializeTestUsers();

    testUserJwt = {
      uuid: testUtils.getTestUser().uuid,
      email: testUtils.getTestUser().email,
      name: testUtils.getTestUser().name,
      nickname: '',
      userType: testUtils.getTestUser().userType,
    };

    placeAuto = await placeService.save({
      name: 'AutoAccept Place',
      description: 'Auto accept concurrency test',
      location: 'Loc',
      region: PlaceRegion.student_hall,
      staffEmail: 'staff@test.com',
      maxMinutes: 24 * 60,
      maxConcurrentReservation: 1,
      openingHours: '{"Everyday":"00:00-24:00"}',
      enableAutoAccept: PlaceEnableAutoAccept.active,
    });

    // Mock side-effectful controller dependencies for speed & isolation
    if (mailService) {
      jest.spyOn(mailService, 'sendPlaceReserveCreateMailToStaff').mockResolvedValue(undefined);
      jest.spyOn(mailService, 'sendPlaceReserveCreateMailToBooker').mockResolvedValue(undefined);
      jest.spyOn(mailService, 'sendReservationPatchMail').mockResolvedValue(undefined);
    }
    jest
      .spyOn(placeService, 'updateReservationCountByDelta')
      .mockResolvedValue(undefined as any);
  });

  afterAll(async () => {
    await app.close();
  });

  async function create(dto: Partial<CreateReservePlaceDto>) {
    return reservePlaceController.createWithNameAndId(testUserJwt, dto as CreateReservePlaceDto);
  }

  describe('Allowed cases (30-min granularity)', () => {
    it('10:00-10:30 then 10:30-11:00 is allowed', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1030' });
      const res = await create({ placeId: placeAuto.uuid, phone: '010', title: 'B', description: 'B', date: '20251224', startTime: '1030', endTime: '1100' });
      expect(res.status).toBe(ReservationStatus.accept);
    });

    it('21:00-22:00, 22:00-23:00, 23:00-24:00 are all allowed sequentially', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '2100', endTime: '2200' });
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'B', description: 'B', date: '20251224', startTime: '2200', endTime: '2300' });
      const res = await create({ placeId: placeAuto.uuid, phone: '010', title: 'C', description: 'C', date: '20251224', startTime: '2300', endTime: '0000' });
      expect(res.status).toBe(ReservationStatus.accept);
    });
  });

  describe('Rejected cases - overlap', () => {
    it('Partial overlap (front): 10:00-11:00 blocks 09:30-10:30', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      await expect(create({ placeId: placeAuto.uuid, phone: '010', title: 'X', description: 'X', date: '20251224', startTime: '0930', endTime: '1030' })).rejects.toThrow();
    });

    it('Partial overlap (back): 10:00-11:00 blocks 10:30-11:30', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      await expect(create({ placeId: placeAuto.uuid, phone: '010', title: 'Y', description: 'Y', date: '20251224', startTime: '1030', endTime: '1130' })).rejects.toThrow();
    });

    it('Inside: 10:00-12:00 blocks 10:30-11:30', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1200' });
      await expect(create({ placeId: placeAuto.uuid, phone: '010', title: 'Z', description: 'Z', date: '20251224', startTime: '1030', endTime: '1130' })).rejects.toThrow();
    });

    it('Wrap: 10:00-11:00 blocks 09:30-11:30', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      await expect(create({ placeId: placeAuto.uuid, phone: '010', title: 'W', description: 'W', date: '20251224', startTime: '0930', endTime: '1130' })).rejects.toThrow();
    });

    it('Midnight partial overlap: 23:00-24:00 blocks 22:30-23:30', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '2300', endTime: '0000' });
      await expect(create({ placeId: placeAuto.uuid, phone: '010', title: 'M', description: 'M', date: '20251224', startTime: '2230', endTime: '2330' })).rejects.toThrow();
    });

    it('Midnight inside: 22:00-24:00 blocks 23:00-24:00', async () => {
      await create({ placeId: placeAuto.uuid, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '2200', endTime: '0000' });
      await expect(create({ placeId: placeAuto.uuid, phone: '010', title: 'M2', description: 'M2', date: '20251224', startTime: '2300', endTime: '0000' })).rejects.toThrow();
    });
  });
});


