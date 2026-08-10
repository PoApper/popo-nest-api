import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as moment from 'moment-timezone';

import configurations from 'src/config/configurations';
import { UserModule } from 'src/popo/user/user.module';
import { UserService } from 'src/popo/user/user.service';
import { PlaceModule } from 'src/popo/place/place.module';
import { PlaceService } from 'src/popo/place/place.service';
import { Place } from 'src/popo/place/place.entity';
import { PlaceEnableAutoAccept, PlaceRegion } from 'src/popo/place/place.meta';
import { TestUtils } from 'src/utils/test-utils';
import { SettingService } from 'src/popo/setting/setting.service';

import { ReservePlaceModule } from './place/reserve.place.module';
import { ReservePlaceService } from './place/reserve.place.service';
import { ReserveEquipModule } from './equip/reserve.equip.module';
import { ReserveEquipService } from './equip/reserve.equip.service';
import { OutdatedReservationService } from './outdated-reservation.service';
import { ReservationStatus } from './reservation.meta';

const GRACE_HOURS = 24;

describe('OutdatedReservationService', () => {
  let app: INestApplication;
  let service: OutdatedReservationService;
  let reservePlaceService: ReservePlaceService;
  let userService: UserService;
  let placeService: PlaceService;
  let jwtService: JwtService;
  let testUtils: TestUtils;

  let testPlace: Place;
  let bookerId: string;

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
        ReserveEquipModule,
        UserModule,
        PlaceModule,
      ],
      providers: [OutdatedReservationService],
    })
      .overrideProvider(SettingService)
      .useValue({ checkRcStudent: jest.fn().mockResolvedValue(false) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<OutdatedReservationService>(
      OutdatedReservationService,
    );
    reservePlaceService =
      moduleFixture.get<ReservePlaceService>(ReservePlaceService);
    moduleFixture.get<ReserveEquipService>(ReserveEquipService);
    userService = moduleFixture.get<UserService>(UserService);
    placeService = moduleFixture.get<PlaceService>(PlaceService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    testUtils = new TestUtils(userService, jwtService);
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    await testUtils.initializeTestUsers();
    bookerId = testUtils.getTestUser().uuid;

    testPlace = await placeService.save({
      name: 'Outdated Test Place',
      description: 'description',
      location: 'location',
      region: PlaceRegion.student_hall,
      staffEmail: 'staff@test.com',
      maxMinutes: 24 * 60,
      maxConcurrentReservation: 1,
      openingHours: '{"Everyday":"00:00-24:00"}',
      enableAutoAccept: PlaceEnableAutoAccept.inactive,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function savePlaceReservation(overrides) {
    return reservePlaceService.save({
      placeId: testPlace.uuid,
      bookerId: bookerId,
      phone: '010-1234-5678',
      title: 'Outdated Reservation',
      description: 'description',
      date: '20200101',
      startTime: '1000',
      endTime: '1100',
      ...overrides,
    });
  }

  function daysAgo(days: number) {
    return moment().tz('Asia/Seoul').subtract(days, 'days').format('YYYYMMDD');
  }

  it('should accept reservations that ended long ago', async () => {
    const longPast = await savePlaceReservation({ date: daysAgo(30) });

    const summary = await service.acceptOutdatedReservations();

    expect(summary.placeAcceptedCount).toBe(1);
    expect(
      (await reservePlaceService.findOneByUuidOrFail(longPast.uuid)).status,
    ).toBe(ReservationStatus.accept);
  });

  it('should leave future reservations untouched', async () => {
    const upcoming = await savePlaceReservation({
      date: moment().tz('Asia/Seoul').add(7, 'days').format('YYYYMMDD'),
    });

    const summary = await service.acceptOutdatedReservations();

    expect(summary.placeAcceptedCount).toBe(0);
    expect(
      (await reservePlaceService.findOneByUuidOrFail(upcoming.uuid)).status,
    ).toBe(ReservationStatus.in_process);
  });

  it('should leave reservations inside the grace period untouched', async () => {
    // 유예 시간(기본 24시간)이 지나지 않은 예약. 오늘 예약은 아직 승인 판단이 필요하다.
    const today = moment().tz('Asia/Seoul');
    const recent = await savePlaceReservation({
      date: today.format('YYYYMMDD'),
      startTime: '0000',
      endTime: '0100',
    });

    const summary = await service.acceptOutdatedReservations();

    expect(summary.placeAcceptedCount).toBe(0);
    expect(
      (await reservePlaceService.findOneByUuidOrFail(recent.uuid)).status,
    ).toBe(ReservationStatus.in_process);
  });

  it('should only touch reservations that are still in process', async () => {
    const rejected = await savePlaceReservation({ date: daysAgo(30) });
    await reservePlaceService.updateStatus(
      rejected.uuid,
      ReservationStatus.reject,
    );

    const summary = await service.acceptOutdatedReservations();

    expect(summary.placeAcceptedCount).toBe(0);
    expect(
      (await reservePlaceService.findOneByUuidOrFail(rejected.uuid)).status,
    ).toBe(ReservationStatus.reject);
  });

  it('should accept overlapping past reservations without complaining', async () => {
    // 지난 예약은 겹침 검사를 하지 않는다. 검사를 하면 서로 겹치는 과거 예약이
    // 영구히 "심사중"으로 남는다.
    const first = await savePlaceReservation({
      date: daysAgo(30),
      startTime: '1000',
      endTime: '1200',
    });
    const second = await savePlaceReservation({
      date: daysAgo(30),
      startTime: '1100',
      endTime: '1300',
    });

    const summary = await service.acceptOutdatedReservations();

    expect(summary.placeAcceptedCount).toBe(2);
    for (const reservation of [first, second]) {
      expect(
        (await reservePlaceService.findOneByUuidOrFail(reservation.uuid))
          .status,
      ).toBe(ReservationStatus.accept);
    }
  });

  it('should treat 0000 end time as midnight of the next day', async () => {
    // GRACE_HOURS 만큼만 지난 어제 자정 종료 예약은 아직 유예 시간 경계에 있다.
    const yesterday = moment()
      .tz('Asia/Seoul')
      .subtract(1, 'day')
      .format('YYYYMMDD');
    const midnightEnded = await savePlaceReservation({
      date: yesterday,
      startTime: '2300',
      endTime: '0000',
    });

    const summary = await service.acceptOutdatedReservations();
    const endMoment = moment
      .tz(yesterday, 'YYYYMMDD', 'Asia/Seoul')
      .add(1, 'day');
    const cutoff = moment().tz('Asia/Seoul').subtract(GRACE_HOURS, 'hours');
    const shouldBeAccepted = endMoment.isSameOrBefore(cutoff);

    expect(summary.placeAcceptedCount).toBe(shouldBeAccepted ? 1 : 0);
    expect(
      (await reservePlaceService.findOneByUuidOrFail(midnightEnded.uuid))
        .status,
    ).toBe(
      shouldBeAccepted
        ? ReservationStatus.accept
        : ReservationStatus.in_process,
    );
  });

  it('should not run on schedule unless explicitly enabled', async () => {
    const runSpy = jest.spyOn(service, 'acceptOutdatedReservations');
    await savePlaceReservation({ date: daysAgo(30) });

    // .env.test 에는 AUTO_ACCEPT_OUTDATED_RESERVATIONS 가 없으므로 비활성이어야 한다.
    await service.autoAcceptOutdatedReservations();

    expect(runSpy).not.toHaveBeenCalled();
    runSpy.mockRestore();
  });
});
