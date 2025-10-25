import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { ReservePlaceModule } from './reserve.place.module';
import { ReservePlaceController } from './reserve.place.controller';
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
import { UserStatus, UserType } from 'src/popo/user/user.meta';
import { Place } from 'src/popo/place/place.entity';

describe('ReservePlace - Create (concurrency, policies, midnight)', () => {
  let app: INestApplication;
  let reservePlaceController: ReservePlaceController;
  let placeService: PlaceService;
  let userService: UserService;
  let mailService: MailService;
  let jwtService: JwtService;
  let testUtils: TestUtils;

  let testUserJwt: JwtPayload;
  let placeAuto: Place;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configurations],
          envFilePath: ['.env.test'],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            configService.get('database'),
        }),
        JwtModule.register({
          secret: 'SECRET',
          signOptions: { expiresIn: '1h' },
        }),
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

    reservePlaceController = moduleFixture.get<ReservePlaceController>(
      ReservePlaceController,
    );
    placeService = moduleFixture.get<PlaceService>(PlaceService);
    userService = moduleFixture.get<UserService>(UserService);
    mailService = moduleFixture.get<MailService>(MailService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    testUtils = new TestUtils(userService, jwtService);
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    await testUtils.initializeTestUsers();

    const user = testUtils.getTestUser();
    testUserJwt = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      nickname: '',
      userType: user.userType,
    };

    // base auto-accept place for convenience
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

    // Mock side-effectful behavior to speed tests
    if (mailService) {
      jest
        .spyOn(mailService, 'sendPlaceReserveCreateMailToStaff')
        .mockResolvedValue(undefined);
      jest
        .spyOn(mailService, 'sendPlaceReserveCreateMailToBooker')
        .mockResolvedValue(undefined);
      jest
        .spyOn(mailService, 'sendReservationPatchMail')
        .mockResolvedValue(undefined);
    }
    jest
      .spyOn(placeService, 'updateReservationCountByDelta')
      .mockResolvedValue(undefined as any);
  });

  afterAll(async () => {
    await app.close();
  });

  async function create(
    dto: Partial<CreateReservePlaceDto>,
    jwt: JwtPayload = testUserJwt,
  ) {
    return reservePlaceController.createWithNameAndId(
      jwt,
      dto as CreateReservePlaceDto,
    );
  }

  // ---- Allowed cases (30-min) ----
  describe('Allowed (30-min granularity, auto-accept)', () => {
    it('10:00-10:30 then 10:30-11:00 is allowed', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1030',
      });
      const res = await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'B',
        description: 'B',
        date: '20251224',
        startTime: '1030',
        endTime: '1100',
      });
      expect(res.status).toBe(ReservationStatus.accept);
    });

    it('21:00-22:00, 22:00-23:00, 23:00-24:00 are sequentially allowed', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '2100',
        endTime: '2200',
      });
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'B',
        description: 'B',
        date: '20251224',
        startTime: '2200',
        endTime: '2300',
      });
      const res = await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'C',
        description: 'C',
        date: '20251224',
        startTime: '2300',
        endTime: '0000',
      });
      expect(res.status).toBe(ReservationStatus.accept);
    });
  });

  // ---- Rejected overlap cases ----
  describe('Rejected overlaps (auto-accept)', () => {
    it('Partial overlap (front): 10:00-11:00 blocks 09:30-10:30', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      });
      await expect(
        create({
          placeId: placeAuto.uuid,
          phone: '010',
          title: 'X',
          description: 'X',
          date: '20251224',
          startTime: '0930',
          endTime: '1030',
        }),
      ).rejects.toThrow();
    });

    it('Partial overlap (back): 10:00-11:00 blocks 10:30-11:30', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      });
      await expect(
        create({
          placeId: placeAuto.uuid,
          phone: '010',
          title: 'Y',
          description: 'Y',
          date: '20251224',
          startTime: '1030',
          endTime: '1130',
        }),
      ).rejects.toThrow();
    });

    it('Inside: 10:00-12:00 blocks 10:30-11:30', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1200',
      });
      await expect(
        create({
          placeId: placeAuto.uuid,
          phone: '010',
          title: 'Z',
          description: 'Z',
          date: '20251224',
          startTime: '1030',
          endTime: '1130',
        }),
      ).rejects.toThrow();
    });

    it('Wrap: 10:00-11:00 blocks 09:30-11:30', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      });
      await expect(
        create({
          placeId: placeAuto.uuid,
          phone: '010',
          title: 'W',
          description: 'W',
          date: '20251224',
          startTime: '0930',
          endTime: '1130',
        }),
      ).rejects.toThrow();
    });

    it('Midnight partial overlap: 23:00-24:00 blocks 22:30-23:30', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '2300',
        endTime: '0000',
      });
      await expect(
        create({
          placeId: placeAuto.uuid,
          phone: '010',
          title: 'M',
          description: 'M',
          date: '20251224',
          startTime: '2230',
          endTime: '2330',
        }),
      ).rejects.toThrow();
    });

    it('Midnight inside: 22:00-24:00 blocks 23:00-24:00', async () => {
      await create({
        placeId: placeAuto.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '2200',
        endTime: '0000',
      });
      await expect(
        create({
          placeId: placeAuto.uuid,
          phone: '010',
          title: 'M2',
          description: 'M2',
          date: '20251224',
          startTime: '2300',
          endTime: '0000',
        }),
      ).rejects.toThrow();
    });
  });

  // ---- Additional policies ----
  describe('maxMinutes overflow', () => {
    it('second sequential reservation rejected when total exceeds maxMinutes', async () => {
      const place = await placeService.save({
        name: 'MaxMinutes Place',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 90,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });

      await create({
        placeId: place.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      }); // 60
      await expect(
        create({
          placeId: place.uuid,
          phone: '010',
          title: 'B',
          description: 'B',
          date: '20251224',
          startTime: '1100',
          endTime: '1200',
        }), // +60 => 120 > 90
      ).rejects.toThrow();
    });
  });

  describe('maxMinutes per reservation (single too long)', () => {
    it('a single reservation longer than maxMinutes should be rejected', async () => {
      const place = await placeService.save({
        name: 'SingleTooLong',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 60,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });

      await expect(
        create({
          placeId: place.uuid,
          phone: '010',
          title: 'TooLong',
          description: 'Too long',
          date: '20251224',
          startTime: '1000',
          endTime: '1130',
        }),
      ).rejects.toThrow();
    });
  });

  describe('maxMinutes cumulative', () => {
    it('second request should be rejected when sum exceeds maxMinutes', async () => {
      const place = await placeService.save({
        name: 'MaxMinutes Cumulative',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 90,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });

      const a = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      }); // 60
      expect(a.status).toBe(ReservationStatus.accept);

      await expect(
        create({
          placeId: place.uuid,
          phone: '010',
          title: 'B',
          description: 'B',
          date: '20251224',
          startTime: '1130',
          endTime: '1230',
        }),
      ).rejects.toThrow();
    });
  });

  describe('maxMinutes across midnight', () => {
    it('23:00-24:00 on D and 00:00-01:00 on D+1 are both allowed with maxMinutes=60', async () => {
      const place = await placeService.save({
        name: 'MaxMinutes Across Midnight',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 60,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });

      const a = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'Late',
        description: 'Late',
        date: '20251224',
        startTime: '2300',
        endTime: '0000',
      });
      const b = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'Early',
        description: 'Early',
        date: '20251225',
        startTime: '0000',
        endTime: '0100',
      });
      expect(a.status).toBe(ReservationStatus.accept);
      expect(b.status).toBe(ReservationStatus.accept);
    });
  });

  describe('RC only place', () => {
    it('non-RC student rejected', async () => {
      const place = await placeService.save({
        name: 'RC Place',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.residential_college,
        staffEmail: 'staff@test.com',
        maxMinutes: 180,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });
      await expect(
        create({
          placeId: place.uuid,
          phone: '010',
          title: 'A',
          description: 'A',
          date: '20251224',
          startTime: '1000',
          endTime: '1100',
        }),
      ).rejects.toThrow();
    });

    it('RC student allowed', async () => {
      // promote test user to RC student
      const u = testUtils.getTestUser();
      await userService.update(u.uuid, {
        email: u.email,
        name: u.name,
        userType: UserType.rc_student,
        userStatus: UserStatus.activated,
      });

      const place = await placeService.save({
        name: 'RC Place',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.residential_college,
        staffEmail: 'staff@test.com',
        maxMinutes: 180,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });
      const res = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      });
      expect(res.status).toBe(ReservationStatus.accept);
    });
  });

  describe('Manual approval workflow (autoaccept=false)', () => {
    it('overlapping requests become in_process, admin accept of second fails', async () => {
      const place = await placeService.save({
        name: 'Manual Place',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 240,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      const a = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      });
      const b = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'B',
        description: 'B',
        date: '20251224',
        startTime: '1030',
        endTime: '1130',
      });
      expect(a.status).toBe(ReservationStatus.in_process);
      expect(b.status).toBe(ReservationStatus.in_process);

      await reservePlaceController.patchStatus(
        a.uuid,
        ReservationStatus.accept,
        'false',
      );
      await expect(
        reservePlaceController.patchStatus(
          b.uuid,
          ReservationStatus.accept,
          'false',
        ),
      ).rejects.toThrow();
    });

    it('non-overlapping second can be accepted by admin', async () => {
      const place = await placeService.save({
        name: 'Manual Place 2',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 240,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      const a = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '1000',
        endTime: '1100',
      });
      const b = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'B',
        description: 'B',
        date: '20251224',
        startTime: '1100',
        endTime: '1200',
      });
      await reservePlaceController.patchStatus(
        a.uuid,
        ReservationStatus.accept,
        'false',
      );
      await expect(
        reservePlaceController.patchStatus(
          b.uuid,
          ReservationStatus.accept,
          'false',
        ),
      ).resolves.toBeUndefined();
    });
  });

  // ---- Cross-date adjacency ----
  describe('Cross-date adjacency', () => {
    it('23:00-24:00 on D, 00:00-01:00 on D+1 are accepted', async () => {
      const place = await placeService.save({
        name: 'CrossDate',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 240,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });

      const a = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251224',
        startTime: '2300',
        endTime: '0000',
      });
      const b = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'B',
        description: 'B',
        date: '20251225',
        startTime: '0000',
        endTime: '0100',
      });
      expect(a.status).toBe(ReservationStatus.accept);
      expect(b.status).toBe(ReservationStatus.accept);
    });

    it('reverse order: 00:00-01:00 on D+1, 23:00-24:00 on D', async () => {
      const place = await placeService.save({
        name: 'CrossDate2',
        description: 'desc',
        location: 'loc',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 240,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.active,
      });

      const a = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'A',
        description: 'A',
        date: '20251225',
        startTime: '0000',
        endTime: '0100',
      });
      const b = await create({
        placeId: place.uuid,
        phone: '010',
        title: 'B',
        description: 'B',
        date: '20251224',
        startTime: '2300',
        endTime: '0000',
      });
      expect(a.status).toBe(ReservationStatus.accept);
      expect(b.status).toBe(ReservationStatus.accept);
    });
  });
});
