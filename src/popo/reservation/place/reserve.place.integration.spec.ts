import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtModule } from '@nestjs/jwt';

import configurations from 'src/config/configurations';
import { UserService } from 'src/popo/user/user.service';
import { UserModule } from 'src/popo/user/user.module';
import { TestUtils } from 'src/utils/test-utils';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/popo/user/user.meta';
import { MailService } from 'src/mail/mail.service';
import { PlaceService } from 'src/popo/place/place.service';
import { PlaceModule } from 'src/popo/place/place.module';
import { PlaceRegion, PlaceEnableAutoAccept } from 'src/popo/place/place.meta';
import { SettingService } from 'src/popo/setting/setting.service';

import { ReservePlaceController } from './reserve.place.controller';
import { ReservePlaceService } from './reserve.place.service';
import { ReservePlaceModule } from './reserve.place.module';
import {
  CreateReservePlaceDto,
  AcceptPlaceReservationListDto,
} from './reserve.place.dto';
import { ReservationStatus } from '../reservation.meta';
import { ReservePlace } from './reserve.place.entity';
import { Place } from 'src/popo/place/place.entity';

describe('ReservePlaceModule - Integration Test', () => {
  let app: INestApplication;

  let reservePlaceController: ReservePlaceController;
  let reservePlaceService: ReservePlaceService;
  let userService: UserService;
  let placeService: PlaceService;
  let testUtils: TestUtils;
  let mailService: MailService;
  let jwtService: JwtService;

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
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            return dbConfig;
          },
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
      .useValue({
        checkRcStudent: jest.fn().mockImplementation(async () => {
          return false;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    reservePlaceController = moduleFixture.get<ReservePlaceController>(
      ReservePlaceController,
    );
    reservePlaceService =
      moduleFixture.get<ReservePlaceService>(ReservePlaceService);
    userService = moduleFixture.get<UserService>(UserService);
    placeService = moduleFixture.get<PlaceService>(PlaceService);
    mailService = moduleFixture.get<MailService>(MailService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    testUtils = new TestUtils(userService, jwtService);
    await testUtils.initializeTestUsers();

    // Mock mail service methods
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
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(reservePlaceController).toBeDefined();
    expect(reservePlaceService).toBeDefined();
  });

  describe('create', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      // Create a test place
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };
    });

    it('should create a place reservation', async () => {
      const dto: CreateReservePlaceDto = {
        placeId: testPlace.uuid,
        phone: '010-1234-5678',
        title: 'Test Reservation',
        description: 'Test reservation description',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      };

      const result = await reservePlaceController.createWithNameAndId(
        testUserJwt,
        dto,
      );

      expect(result).toBeDefined();
      expect(result.placeId).toBe(dto.placeId);
      expect(result.phone).toBe(dto.phone);
      expect(result.title).toBe(dto.title);
      expect(result.description).toBe(dto.description);
      expect(result.date).toBe(dto.date);
      expect(result.startTime).toBe(dto.startTime);
      expect(result.endTime).toBe(dto.endTime);
      expect(result.bookerId).toBe(testUserJwt.uuid);
      expect(result.status).toBe(ReservationStatus.in_process);
    });

    it('should check reservation possibility', async () => {
      const dto: CreateReservePlaceDto = {
        placeId: testPlace.uuid,
        phone: '010-1234-5678',
        title: 'Test Reservation',
        description: 'Test reservation description',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      };

      await expect(
        reservePlaceController.checkReservationPossible(testUserJwt, dto),
      ).resolves.not.toThrow();
    });
  });

  describe('getAll', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations
      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Test Reservation 1',
        description: 'Test reservation description 1',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });

      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Test Reservation 2',
        description: 'Test reservation description 2',
        date: '20241202',
        startTime: '1000',
        endTime: '1200',
      });
    });

    it('should get all reservations', async () => {
      const result = await reservePlaceController.getAll(
        null,
        null,
        null,
        null,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should get reservations by status', async () => {
      const result = await reservePlaceController.getAll(
        '심사중',
        null,
        null,
        null,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach((reservation) => {
        expect(reservation.status).toBe(ReservationStatus.in_process);
      });
    });

    it('should get reservations by date', async () => {
      const result = await reservePlaceController.getAll(
        null,
        '20241201',
        null,
        null,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach((reservation) => {
        expect(reservation.date).toBe('20241201');
      });
    });

    it('should get reservations with pagination', async () => {
      const result = await reservePlaceController.getAll(null, null, 0, 1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getMyReservation', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations for the user
      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'My Reservation 1',
        description: 'My reservation description 1',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });

      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'My Reservation 2',
        description: 'My reservation description 2',
        date: '20241202',
        startTime: '1000',
        endTime: '1200',
      });
    });

    it('should get user reservations', async () => {
      const result = await reservePlaceController.getMyReservation(
        testUserJwt,
        null,
        null,
      );

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.total).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(2);

      result.items.forEach((reservation) => {
        expect(reservation.bookerId).toBe(testUserJwt.uuid);
      });
    });

    it('should get user reservations with pagination', async () => {
      const result = await reservePlaceController.getMyReservation(
        testUserJwt,
        0,
        1,
      );

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeLessThanOrEqual(1);
      expect(result.total).toBeDefined();
    });
  });

  describe('getUserReservation', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations for the user
      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'User Reservation 1',
        description: 'User reservation description 1',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });
    });

    it('should get reservations by user uuid', async () => {
      const result = await reservePlaceController.getUserReservation(
        testUserJwt.uuid,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);

      result.forEach((reservation) => {
        expect(reservation.bookerId).toBe(testUserJwt.uuid);
      });
    });
  });

  describe('getByPlace', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations for the place
      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Place Reservation 1',
        description: 'Place reservation description 1',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });
    });

    it('should get reservations by place uuid', async () => {
      const result = await reservePlaceController.getByPlace(testPlace.uuid);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);

      result.forEach((reservation) => {
        expect(reservation.placeId).toBe(testPlace.uuid);
      });
    });
  });

  describe('checkByPlaceName', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place Name',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations for the place
      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Place Name Reservation 1',
        description: 'Place name reservation description 1',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });
    });

    it('should get reservations by place name', async () => {
      const result = await reservePlaceController.checkByPlaceName(
        'Test Place Name',
        null,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should get reservations by place name and start date', async () => {
      const result = await reservePlaceController.checkByPlaceName(
        'Test Place Name',
        '20241201',
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('checkByPlaceNameAndDate', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place Name',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations for the place
      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Place Name Date Reservation 1',
        description: 'Place name date reservation description 1',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });
    });

    it('should get reservations by place name and date', async () => {
      const result = await reservePlaceController.checkByPlaceNameAndDate(
        'Test Place Name',
        '20241201',
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);

      result.forEach((reservation) => {
        expect(reservation.date).toBe('20241201');
      });
    });
  });

  describe('syncPlaceReservationCount', () => {
    beforeEach(async () => {
      await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });
    });

    it('should sync place reservation count', async () => {
      const result = await reservePlaceController.syncPlaceReservationCount();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Sync Done');
    });
  });

  describe('patchStatus', () => {
    let testPlace: Place;
    let testReservation: ReservePlace;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservation
      testReservation = await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Status Test Reservation',
        description: 'Status test reservation description',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });
    });

    it('should update reservation status to accept', async () => {
      await reservePlaceController.patchStatus(
        testReservation.uuid,
        ReservationStatus.accept,
        'false',
      );

      // Verify the status was updated in the database
      const updatedReservation = await reservePlaceService.findOneByUuidOrFail(
        testReservation.uuid,
      );
      expect(updatedReservation.status).toBe(ReservationStatus.accept);
    });

    it('should update reservation status to reject', async () => {
      await reservePlaceController.patchStatus(
        testReservation.uuid,
        ReservationStatus.reject,
        'false',
      );

      // Verify the status was updated in the database
      const updatedReservation = await reservePlaceService.findOneByUuidOrFail(
        testReservation.uuid,
      );
      expect(updatedReservation.status).toBe(ReservationStatus.reject);
    });

    it('should send email when sendEmail is true', async () => {
      const sendEmailSpy = jest.spyOn(mailService, 'sendReservationPatchMail');

      await reservePlaceController.patchStatus(
        testReservation.uuid,
        ReservationStatus.accept,
        'true',
      );

      expect(sendEmailSpy).toHaveBeenCalled();
    });
  });

  describe('acceptAllStatus', () => {
    let testPlace: Place;
    let testReservations: ReservePlace[];
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations with different dates to avoid concurrent reservation issues
      testReservations = [];
      for (let i = 0; i < 3; i++) {
        const reservation = await reservePlaceService.save({
          placeId: testPlace.uuid,
          bookerId: testUserJwt.uuid,
          phone: '010-1234-5678',
          title: `Batch Test Reservation ${i + 1}`,
          description: `Batch test reservation description ${i + 1}`,
          date: `2024120${i + 1}`, // Different dates
          startTime: '1400',
          endTime: '1600',
        });
        testReservations.push(reservation);
      }
    });

    it('should accept all reservations in the list', async () => {
      const dto: AcceptPlaceReservationListDto = {
        uuidList: testReservations.map((r) => r.uuid),
      };

      await reservePlaceController.acceptAllStatus(dto, 'false');

      // Verify all reservations were accepted
      for (const reservation of testReservations) {
        const updatedReservation =
          await reservePlaceService.findOneByUuidOrFail(reservation.uuid);
        expect(updatedReservation.status).toBe(ReservationStatus.accept);
      }
    });

    it('should send emails when sendEmail is true', async () => {
      const sendEmailSpy = jest.spyOn(mailService, 'sendReservationPatchMail');

      const dto: AcceptPlaceReservationListDto = {
        uuidList: testReservations.map((r) => r.uuid),
      };

      await reservePlaceController.acceptAllStatus(dto, 'true');

      expect(sendEmailSpy).toHaveBeenCalled();
    });

    it('should return a summary of accepted reservations', async () => {
      const dto: AcceptPlaceReservationListDto = {
        uuidList: testReservations.map((r) => r.uuid),
      };

      const result = await reservePlaceController.acceptAllStatus(dto, 'false');

      expect(result.totalCount).toBe(3);
      expect(result.acceptedCount).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.acceptedUuidList).toHaveLength(3);
      expect(result.skippedList).toHaveLength(0);
    });

    describe('with overlapping reservations', () => {
      let overlapPlace: Place;
      let earlierReservation: ReservePlace;
      let overlappingReservation: ReservePlace;
      let independentReservation: ReservePlace;

      beforeEach(async () => {
        // maxConcurrentReservation: 1 이므로 시간이 겹치는 예약은 1건만 승인될 수 있다.
        // maxMinutes 는 넉넉히 두어 일일 총 예약 시간 제한이 아니라
        // 동시 예약 제한 때문에 걸러지는 상황을 만든다.
        overlapPlace = await placeService.save({
          name: 'Overlap Test Place',
          description: 'Test place description',
          location: 'Test location',
          region: PlaceRegion.student_hall,
          staffEmail: 'staff@test.com',
          maxMinutes: 24 * 60,
          maxConcurrentReservation: 1,
          openingHours: '{"Everyday":"00:00-24:00"}',
          enableAutoAccept: PlaceEnableAutoAccept.inactive,
        });

        earlierReservation = await reservePlaceService.save({
          placeId: overlapPlace.uuid,
          bookerId: testUserJwt.uuid,
          phone: '010-1234-5678',
          title: 'Earlier Reservation',
          description: 'Should be accepted',
          date: '20241210',
          startTime: '1400',
          endTime: '1600',
        });

        overlappingReservation = await reservePlaceService.save({
          placeId: overlapPlace.uuid,
          bookerId: testUserJwt.uuid,
          phone: '010-1234-5678',
          title: 'Overlapping Reservation',
          description: 'Should be skipped',
          date: '20241210',
          startTime: '1500',
          endTime: '1700',
        });

        // 겹치지 않는 시간대의 예약은 중복 건 때문에 막히지 않아야 한다.
        independentReservation = await reservePlaceService.save({
          placeId: overlapPlace.uuid,
          bookerId: testUserJwt.uuid,
          phone: '010-1234-5678',
          title: 'Independent Reservation',
          description: 'Should be accepted',
          date: '20241210',
          startTime: '1800',
          endTime: '1900',
        });
      });

      it('should skip overlapping reservations and accept the rest', async () => {
        const dto: AcceptPlaceReservationListDto = {
          uuidList: [
            earlierReservation.uuid,
            overlappingReservation.uuid,
            independentReservation.uuid,
          ],
        };

        const result = await reservePlaceController.acceptAllStatus(
          dto,
          'false',
        );

        expect(result.totalCount).toBe(3);
        expect(result.acceptedCount).toBe(2);
        expect(result.skippedCount).toBe(1);

        // 겹치는 두 건 중 정확히 하나만 승인되어야 한다.
        // 두 건의 createdAt 이 동일할 수 있어 어느 쪽이 먼저 처리되는지는 고정되지 않는다.
        const overlappingPair = [
          earlierReservation.uuid,
          overlappingReservation.uuid,
        ];
        const acceptedFromPair = result.acceptedUuidList.filter((uuid) =>
          overlappingPair.includes(uuid),
        );
        expect(acceptedFromPair).toHaveLength(1);
        expect(overlappingPair).toContain(result.skippedList[0].uuid);
        expect(result.skippedList[0].reason).toBeTruthy();

        // 겹치는 건 때문에 처리가 중단되지 않고, 무관한 예약은 반드시 승인되어야 한다.
        expect(result.acceptedUuidList).toContain(independentReservation.uuid);
        expect(
          (
            await reservePlaceService.findOneByUuidOrFail(
              independentReservation.uuid,
            )
          ).status,
        ).toBe(ReservationStatus.accept);
        expect(
          (
            await reservePlaceService.findOneByUuidOrFail(
              result.skippedList[0].uuid,
            )
          ).status,
        ).toBe(ReservationStatus.in_process);
      });

      it('should skip non-existent reservation uuid without throwing error', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        const dto: AcceptPlaceReservationListDto = {
          uuidList: [fakeUuid, independentReservation.uuid],
        };

        const result = await reservePlaceController.acceptAllStatus(
          dto,
          'false',
        );

        expect(result.totalCount).toBe(2);
        expect(result.acceptedCount).toBe(1);
        expect(result.skippedCount).toBe(1);
        expect(result.skippedList[0].uuid).toBe(fakeUuid);
        expect(result.acceptedUuidList).toEqual([independentReservation.uuid]);
      });
    });

    describe('rejectAllStatus', () => {
      let reservationA: ReservePlace;
      let reservationB: ReservePlace;

      beforeEach(async () => {
        const place = await placeService.save({
          name: 'Reject Test Place',
          description: 'Test place description',
          location: 'Test location',
          region: PlaceRegion.student_hall,
          staffEmail: 'staff@test.com',
          maxMinutes: 120,
          maxConcurrentReservation: 1,
          openingHours: '{"Everyday":"00:00-24:00"}',
          enableAutoAccept: PlaceEnableAutoAccept.inactive,
        });

        reservationA = await reservePlaceService.save({
          placeId: place.uuid,
          bookerId: testUserJwt.uuid,
          phone: '010-1234-5678',
          title: 'Reject Reservation A',
          description: 'To be rejected',
          date: '20241211',
          startTime: '1000',
          endTime: '1100',
        });

        reservationB = await reservePlaceService.save({
          placeId: place.uuid,
          bookerId: testUserJwt.uuid,
          phone: '010-1234-5678',
          title: 'Reject Reservation B',
          description: 'To be rejected as well',
          date: '20241211',
          startTime: '1400',
          endTime: '1500',
        });
      });

      it('should reject all valid reservations successfully', async () => {
        const dto: AcceptPlaceReservationListDto = {
          uuidList: [reservationA.uuid, reservationB.uuid],
        };

        const result = await reservePlaceController.rejectAllStatus(
          dto,
          'false',
        );

        expect(result.totalCount).toBe(2);
        expect(result.acceptedCount).toBe(2);
        expect(result.skippedCount).toBe(0);
        expect(result.acceptedUuidList).toEqual([
          reservationA.uuid,
          reservationB.uuid,
        ]);

        const updatedA = await reservePlaceService.findOneByUuidOrFail(
          reservationA.uuid,
        );
        const updatedB = await reservePlaceService.findOneByUuidOrFail(
          reservationB.uuid,
        );
        expect(updatedA.status).toBe(ReservationStatus.reject);
        expect(updatedB.status).toBe(ReservationStatus.reject);
      });

      it('should skip non-existent uuid and reject the remaining reservations', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        const dto: AcceptPlaceReservationListDto = {
          uuidList: [reservationA.uuid, fakeUuid],
        };

        const result = await reservePlaceController.rejectAllStatus(
          dto,
          'false',
        );

        expect(result.totalCount).toBe(2);
        expect(result.acceptedCount).toBe(1);
        expect(result.skippedCount).toBe(1);
        expect(result.acceptedUuidList).toEqual([reservationA.uuid]);
        expect(result.skippedList[0].uuid).toBe(fakeUuid);

        const updatedA = await reservePlaceService.findOneByUuidOrFail(
          reservationA.uuid,
        );
        expect(updatedA.status).toBe(ReservationStatus.reject);
      });

      it('should send notification email when sendEmail is true', async () => {
        const mailSpy = jest.spyOn(mailService, 'sendReservationPatchMail');
        const dto: AcceptPlaceReservationListDto = {
          uuidList: [reservationA.uuid],
        };

        await reservePlaceController.rejectAllStatus(dto, 'true');

        expect(mailSpy).toHaveBeenCalledWith(
          testUserJwt.email,
          reservationA.title,
          ReservationStatus.reject,
        );
      });
    });
  });

  describe('getAll with filters', () => {
    let placeA: Place;
    let placeB: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      const basePlaceDto = {
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 24 * 60,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      };

      placeA = await placeService.save({
        ...basePlaceDto,
        name: 'Filter Place A',
      });
      placeB = await placeService.save({
        ...basePlaceDto,
        name: 'Filter Place B',
      });

      await reservePlaceService.save({
        placeId: placeA.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: '동아리 정기 공연',
        description: 'A place, early date',
        date: '20241201',
        startTime: '1000',
        endTime: '1100',
      });
      await reservePlaceService.save({
        placeId: placeA.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: '학생회 회의',
        description: 'A place, late date',
        date: '20241215',
        startTime: '1000',
        endTime: '1100',
      });
      await reservePlaceService.save({
        placeId: placeB.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: '동아리 연습',
        description: 'B place',
        date: '20241210',
        startTime: '1000',
        endTime: '1100',
      });
    });

    it('should filter reservations by placeId', async () => {
      const result = await reservePlaceController.getAll(
        null,
        null,
        null,
        null,
        placeA.uuid,
      );

      expect(result).toHaveLength(2);
      result.forEach((reservation) => {
        expect(reservation.placeId).toBe(placeA.uuid);
      });
    });

    it('should filter reservations by date range', async () => {
      const result = await reservePlaceController.getAll(
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        '20241205',
        '20241220',
      );

      expect(result).toHaveLength(2);
      result.forEach((reservation) => {
        expect(reservation.date >= '20241205').toBe(true);
        expect(reservation.date <= '20241220').toBe(true);
      });
    });

    it('should filter reservations by partial title', async () => {
      const result = await reservePlaceController.getAll(
        null,
        null,
        null,
        null,
        null,
        null,
        '동아리',
      );

      expect(result).toHaveLength(2);
      result.forEach((reservation) => {
        expect(reservation.title).toContain('동아리');
      });
    });

    it('should order reservations by reservation date', async () => {
      const result = await reservePlaceController.getAll(
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'date',
        'ASC',
      );

      expect(result.map((reservation) => reservation.date)).toEqual([
        '20241201',
        '20241210',
        '20241215',
      ]);
    });

    it('should count reservations with the same filters', async () => {
      const totalCount = await reservePlaceController.count();
      const placeACount = await reservePlaceController.count(
        null,
        null,
        placeA.uuid,
      );

      expect(totalCount).toBe(3);
      expect(placeACount).toBe(2);
    });
  });

  describe('delete', () => {
    let testPlace: Place;
    let testReservation: ReservePlace;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservation with future date
      testReservation = await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Delete Test Reservation',
        description: 'Delete test reservation description',
        date: (() => {
          // generate future date
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return (
            d.getFullYear() +
            String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0')
          );
        })(), // Future date
        startTime: '1400',
        endTime: '1600',
      });
    });

    it('should delete reservation by owner', async () => {
      await reservePlaceController.delete(testReservation.uuid, testUserJwt);

      // Verify reservation was deleted
      await expect(
        reservePlaceService.findOneByUuidOrFail(testReservation.uuid),
      ).rejects.toThrow();
    });

    it('should delete reservation by admin', async () => {
      const adminJwt: JwtPayload = {
        uuid: testUtils.getTestAdmin().uuid,
        email: testUtils.getTestAdmin().email,
        name: testUtils.getTestAdmin().name,
        nickname: '',
        userType: testUtils.getTestAdmin().userType,
      };

      await reservePlaceController.delete(testReservation.uuid, adminJwt);

      // Verify reservation was deleted
      await expect(
        reservePlaceService.findOneByUuidOrFail(testReservation.uuid),
      ).rejects.toThrow();
    });

    it('should throw UnauthorizedException when user is not owner or admin', async () => {
      const anotherUserJwt: JwtPayload = {
        uuid: 'another-user-uuid',
        email: 'another@test.com',
        name: 'Another User',
        nickname: '',
        userType: UserType.student,
      };

      await expect(
        reservePlaceController.delete(testReservation.uuid, anotherUserJwt),
      ).rejects.toThrow('Unauthorized delete action');
    });

    it('should throw BadRequestException when trying to delete past reservation', async () => {
      // Create a past reservation
      const pastReservation = await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Past Reservation',
        description: 'Past reservation description',
        date: '20200101', // Past date
        startTime: '1400',
        endTime: '1600',
      });

      await expect(
        reservePlaceController.delete(pastReservation.uuid, testUserJwt),
      ).rejects.toThrow('Cannot delete past reservation');
    });
  });

  describe('count', () => {
    let testPlace: Place;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testPlace = await placeService.save({
        name: 'Test Place',
        description: 'Test place description',
        location: 'Test location',
        region: PlaceRegion.student_hall,
        staffEmail: 'staff@test.com',
        maxMinutes: 120,
        maxConcurrentReservation: 1,
        openingHours: '{"Everyday":"00:00-24:00"}',
        enableAutoAccept: PlaceEnableAutoAccept.inactive,
      });

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '',
        userType: testUtils.getTestUser().userType,
      };

      // Create test reservations
      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Count Test Reservation 1',
        description: 'Count test reservation description 1',
        date: '20241201',
        startTime: '1400',
        endTime: '1600',
      });

      await reservePlaceService.save({
        placeId: testPlace.uuid,
        bookerId: testUserJwt.uuid,
        phone: '010-1234-5678',
        title: 'Count Test Reservation 2',
        description: 'Count test reservation description 2',
        date: '20241202',
        startTime: '1000',
        endTime: '1200',
      });
    });

    it('should return total count of reservations', async () => {
      const result = await reservePlaceController.count();

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toEqual(2);
    });
  });
});
