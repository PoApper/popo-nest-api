import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';

import configurations from 'src/config/configurations';
import { ReserveEquipModule } from './reserve.equip.module';
import { ReserveEquipController } from './reserve.equip.controller';
import { ReserveEquipService } from './reserve.equip.service';
import { ReserveEquip } from './reserve.equip.entity';
import { UserModule } from 'src/popo/user/user.module';
import { UserService } from 'src/popo/user/user.service';
import { EquipModule } from 'src/popo/equip/equip.module';
import { EquipService } from 'src/popo/equip/equip.service';
import { Equip } from 'src/popo/equip/equip.entity';
import { EquipOwner } from 'src/popo/equip/equip.meta';
import { TestUtils } from 'src/utils/test-utils';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { SettingService } from 'src/popo/setting/setting.service';
import { MailService } from 'src/mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { AcceptEquipReservationListDto } from './reserve.equip.dto';

describe('ReserveEquip - Bulk accept & filters', () => {
  let app: INestApplication;
  let controller: ReserveEquipController;
  let reserveEquipService: ReserveEquipService;
  let reserveEquipRepo: Repository<ReserveEquip>;
  let equipService: EquipService;
  let userService: UserService;
  let mailService: MailService;
  let jwtService: JwtService;
  let testUtils: TestUtils;

  let testUserJwt: JwtPayload;
  let equipment: Equip;
  let otherEquipment: Equip;

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
        ReserveEquipModule,
        UserModule,
        EquipModule,
      ],
    })
      .overrideProvider(SettingService)
      .useValue({ checkRcStudent: jest.fn().mockResolvedValue(false) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    controller = moduleFixture.get<ReserveEquipController>(
      ReserveEquipController,
    );
    reserveEquipService =
      moduleFixture.get<ReserveEquipService>(ReserveEquipService);
    reserveEquipRepo = moduleFixture.get<Repository<ReserveEquip>>(
      getRepositoryToken(ReserveEquip),
    );
    equipService = moduleFixture.get<EquipService>(EquipService);
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

    equipment = await equipService.save({
      name: 'Tripod',
      description: 'tripod',
      equipOwner: EquipOwner.dongyeon,
      staffEmail: 'staff@test.com',
      maxMinutes: 24 * 60,
      fee: 10000,
      openingHours: '{"Everyday":"00:00-24:00"}',
    });
    otherEquipment = await equipService.save({
      name: 'Mic',
      description: 'mic',
      equipOwner: EquipOwner.dongyeon,
      staffEmail: 'staff@test.com',
      maxMinutes: 24 * 60,
      fee: 5000,
      openingHours: '{"Everyday":"00:00-24:00"}',
    });

    if (mailService) {
      jest
        .spyOn(mailService, 'sendEquipReserveCreateMailToStaff')
        .mockResolvedValue(undefined);
      jest
        .spyOn(mailService, 'sendEquipReserveCreateMailToBooker')
        .mockResolvedValue(undefined);
      jest
        .spyOn(mailService, 'sendReservationPatchMail')
        .mockResolvedValue(undefined);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * 겹치는 "심사중" 예약을 DB에 직접 넣는다.
   */
  function saveOverlappingReservationDirectly(
    overrides: Partial<ReserveEquip>,
  ): Promise<ReserveEquip> {
    return reserveEquipRepo.save(
      reserveEquipRepo.create({
        equipments: [equipment.uuid],
        bookerId: testUserJwt.uuid,
        owner: EquipOwner.dongyeon,
        phone: '010-1234-5678',
        title: 'Equip Reservation',
        description: 'description',
        date: '20241210',
        startTime: '1000',
        endTime: '1100',
        status: ReservationStatus.in_process,
        ...overrides,
      }),
    );
  }

  function saveReservation(overrides) {
    return reserveEquipService.save({
      equipments: [equipment.uuid],
      bookerId: testUserJwt.uuid,
      owner: EquipOwner.dongyeon,
      phone: '010-1234-5678',
      title: 'Equip Reservation',
      description: 'description',
      date: '20241210',
      startTime: '1000',
      endTime: '1100',
      ...overrides,
    });
  }

  describe('acceptAllStatus', () => {
    it('should accept every reservation when none of them overlap', async () => {
      const first = await saveReservation({
        title: 'First',
        startTime: '1000',
        endTime: '1100',
      });
      const second = await saveReservation({
        title: 'Second',
        startTime: '1100',
        endTime: '1200',
      });

      const dto: AcceptEquipReservationListDto = {
        uuidList: [first.uuid, second.uuid],
      };

      const result = await controller.acceptAllStatus(dto, 'false');

      expect(result.totalCount).toBe(2);
      expect(result.acceptedCount).toBe(2);
      expect(result.skippedCount).toBe(0);

      for (const reservation of [first, second]) {
        const updated = await reserveEquipService.findOneByUuidOrFail(
          reservation.uuid,
        );
        expect(updated.status).toBe(ReservationStatus.accept);
      }
    });

    it('should skip overlapping reservations instead of aborting the batch', async () => {
      // 정책 변경 전에 쌓여 있던, 서로 겹치는 "심사중" 예약 상황을 재현한다.
      const overlapping = await saveOverlappingReservationDirectly({
        title: 'Overlapping',
        startTime: '1100',
        endTime: '1300',
      });
      // 다른 장비의 예약은 시간이 겹쳐도 영향을 받지 않아야 한다.
      const independent = await saveReservation({
        title: 'Other Equipment',
        equipments: [otherEquipment.uuid],
        startTime: '1100',
        endTime: '1300',
      });

      // 겹치는 예약 중 한 건을 먼저 승인해 둔다.
      const accepted = await saveOverlappingReservationDirectly({
        title: 'Already Accepted',
        startTime: '1000',
        endTime: '1200',
      });
      await reserveEquipService.updateStatus(
        accepted.uuid,
        ReservationStatus.accept,
      );

      const dto: AcceptEquipReservationListDto = {
        uuidList: [overlapping.uuid, independent.uuid],
      };

      const result = await controller.acceptAllStatus(dto, 'false');

      expect(result.acceptedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.acceptedUuidList).toEqual([independent.uuid]);
      expect(result.skippedList[0].uuid).toBe(overlapping.uuid);
      expect(result.skippedList[0].reason).toBeTruthy();

      expect(
        (await reserveEquipService.findOneByUuidOrFail(overlapping.uuid))
          .status,
      ).toBe(ReservationStatus.in_process);
      expect(
        (await reserveEquipService.findOneByUuidOrFail(independent.uuid))
          .status,
      ).toBe(ReservationStatus.accept);
    });

    it('should skip non-existent reservation uuid without throwing error', async () => {
      const reservation = await saveReservation({ title: 'Valid' });
      const fakeUuid = '00000000-0000-0000-0000-000000000000';

      const result = await controller.acceptAllStatus(
        { uuidList: [fakeUuid, reservation.uuid] },
        'false',
      );

      expect(result.totalCount).toBe(2);
      expect(result.acceptedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.skippedList[0].uuid).toBe(fakeUuid);
      expect(result.acceptedUuidList).toEqual([reservation.uuid]);
    });

    it('should not send emails when sendEmail is not requested', async () => {
      const sendEmailSpy = jest.spyOn(mailService, 'sendReservationPatchMail');
      const reservation = await saveReservation({ title: 'No Mail' });

      await controller.acceptAllStatus({ uuidList: [reservation.uuid] });

      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('rejectAllStatus', () => {
    let first: ReserveEquip;
    let second: ReserveEquip;

    beforeEach(async () => {
      first = await saveReservation({
        title: 'Reject Target 1',
        startTime: '1000',
        endTime: '1200',
      });
      second = await saveReservation({
        title: 'Reject Target 2',
        startTime: '1400',
        endTime: '1600',
      });
    });

    it('should reject all valid reservations successfully', async () => {
      const result = await controller.rejectAllStatus(
        { uuidList: [first.uuid, second.uuid] },
        'false',
      );

      expect(result.totalCount).toBe(2);
      expect(result.acceptedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.acceptedUuidList).toEqual([first.uuid, second.uuid]);

      const updatedFirst = await reserveEquipService.findOneByUuidOrFail(
        first.uuid,
      );
      const updatedSecond = await reserveEquipService.findOneByUuidOrFail(
        second.uuid,
      );
      expect(updatedFirst.status).toBe(ReservationStatus.reject);
      expect(updatedSecond.status).toBe(ReservationStatus.reject);
    });

    it('should skip non-existent uuid and reject remaining reservations', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const result = await controller.rejectAllStatus(
        { uuidList: [first.uuid, fakeUuid] },
        'false',
      );

      expect(result.totalCount).toBe(2);
      expect(result.acceptedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.acceptedUuidList).toEqual([first.uuid]);
      expect(result.skippedList[0].uuid).toBe(fakeUuid);

      const updatedFirst = await reserveEquipService.findOneByUuidOrFail(
        first.uuid,
      );
      expect(updatedFirst.status).toBe(ReservationStatus.reject);
    });

    it('should send notification email when sendEmail is true', async () => {
      const sendEmailSpy = jest.spyOn(mailService, 'sendReservationPatchMail');

      await controller.rejectAllStatus({ uuidList: [first.uuid] }, 'true');

      expect(sendEmailSpy).toHaveBeenCalledWith(
        testUserJwt.email,
        first.title,
        ReservationStatus.reject,
      );
    });
  });

  describe('getAll with filters', () => {
    beforeEach(async () => {
      await saveReservation({ title: '동아리 촬영', date: '20241201' });
      await saveReservation({ title: '학생회 촬영', date: '20241215' });
      await saveReservation({
        title: '동아리 공연',
        date: '20241210',
        equipments: [otherEquipment.uuid],
      });
    });

    it('should filter by date range', async () => {
      const result = await controller.getAll(
        null,
        null,
        null,
        '20241205',
        null,
        null,
        null,
        null,
        '20241220',
      );

      expect(result).toHaveLength(2);
      result.forEach((reservation) => {
        expect(reservation.date >= '20241205').toBe(true);
        expect(reservation.date <= '20241220').toBe(true);
      });
    });

    it('should filter by partial title', async () => {
      const result = await controller.getAll(
        null,
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

    it('should order by reservation date', async () => {
      const result = await controller.getAll(
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

    it('should count with the same filters', async () => {
      const totalCount = await controller.count();
      const filteredCount = await controller.count(
        null,
        null,
        null,
        null,
        '동아리',
      );

      expect(totalCount).toBe(3);
      expect(filteredCount).toBe(2);
    });
  });
});
