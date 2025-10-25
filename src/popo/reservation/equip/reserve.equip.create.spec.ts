import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { ReserveEquipModule } from './reserve.equip.module';
import { ReserveEquipController } from './reserve.equip.controller';
import { ReserveEquipService } from './reserve.equip.service';
import { UserModule } from 'src/popo/user/user.module';
import { EquipModule } from 'src/popo/equip/equip.module';
import { EquipService } from 'src/popo/equip/equip.service';
import { TestUtils } from 'src/utils/test-utils';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { SettingService } from 'src/popo/setting/setting.service';
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { ReservationStatus } from '../reservation.meta';
import { MailService } from 'src/mail/mail.service';
import { EquipOwner } from 'src/popo/equip/equip.meta';
import { UserService } from 'src/popo/user/user.service';

describe('ReserveEquip - Create (single equipment, overlap & midnight)', () => {
  let app: INestApplication;
  let controller: ReserveEquipController;
  let service: ReserveEquipService;
  let equipService: EquipService;
  let mailService: MailService;
  let jwtService: JwtService;
  let testUtils: TestUtils;
  let userService: UserService;

  let testUserJwt: JwtPayload;
  let equipment: any;

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

    controller = moduleFixture.get<ReserveEquipController>(ReserveEquipController);
    service = moduleFixture.get<ReserveEquipService>(ReserveEquipService);
    equipService = moduleFixture.get<EquipService>(EquipService);
    mailService = moduleFixture.get<MailService>(MailService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userService = moduleFixture.get<UserService>(UserService);

    testUtils = new TestUtils(userService, jwtService);
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    await testUtils.initializeTestUsers();

    const user = testUtils.getTestUser();
    testUserJwt = { uuid: user.uuid, email: user.email, name: user.name, nickname: '', userType: user.userType };

    // create a single equipment to use
    equipment = await equipService.save({
      name: 'Tripod', description: 'tripod', equipOwner: EquipOwner.dongyeon, staffEmail: 'staff@test.com',
      maxMinutes: 180, fee: 10000,
    });

    // mock side-effects for speed
    if (mailService) {
      jest.spyOn(mailService, 'sendEquipReserveCreateMailToStaff').mockResolvedValue(undefined);
      jest.spyOn(mailService, 'sendEquipReserveCreateMailToBooker').mockResolvedValue(undefined);
      jest.spyOn(mailService, 'sendReservationPatchMail').mockResolvedValue(undefined);
    }
    jest.spyOn(equipService, 'updateReservationCountByDelta').mockResolvedValue(undefined as any);
  });

  afterAll(async () => {
    await app.close();
  });

  async function create(dto: Partial<CreateReserveEquipDto>) {
    return controller.post(testUserJwt, dto as CreateReserveEquipDto);
  }

  describe('Allowed (30-min, single equipment)', () => {
    it('10:00-10:30 then 10:30-11:00 allowed', async () => {
      await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1030' });
      const res = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'B', description: 'B', date: '20251224', startTime: '1030', endTime: '1100' });
      expect(res.status).toBe(ReservationStatus.in_process); // equipment defaults to in_process
    });

    it('21:00-22:00, 22:00-23:00, 23:00-24:00 sequential allowed', async () => {
      await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '2100', endTime: '2200' });
      await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'B', description: 'B', date: '20251224', startTime: '2200', endTime: '2300' });
      const res = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'C', description: 'C', date: '20251224', startTime: '2300', endTime: '0000' });
      expect(res.status).toBe(ReservationStatus.in_process);
    });
  });

  describe('Admin acceptance (overlap vs non-overlap)', () => {
    it('Overlapping request should fail on admin accept', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      const b = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'X', description: 'X', date: '20251224', startTime: '0930', endTime: '1030' });
      expect(a.status).toBe(ReservationStatus.in_process);
      expect(b.status).toBe(ReservationStatus.in_process);

      // accept first
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      // then attempting to accept overlapping one should throw
      await expect(
        controller.patchStatus(b.uuid, ReservationStatus.accept, false)
      ).rejects.toThrow();
    });

    it('Non-overlapping request should be accepted by admin', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      const b = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'Y', description: 'Y', date: '20251224', startTime: '1100', endTime: '1200' });
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      await expect(
        controller.patchStatus(b.uuid, ReservationStatus.accept, false)
      ).resolves.toBeUndefined();
    });

    it('Midnight overlap should fail on accept: 23:00-24:00 vs 22:30-23:30', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '2300', endTime: '0000' });
      const b = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'M', description: 'M', date: '20251224', startTime: '2230', endTime: '2330' });
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      await expect(
        controller.patchStatus(b.uuid, ReservationStatus.accept, false)
      ).rejects.toThrow();
    });
  });

  describe('Creation rejection when overlapping with an accepted reservation', () => {
    it('Normal create → accept → front-overlap create should fail', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      await expect(
        create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'X', description: 'X', date: '20251224', startTime: '0930', endTime: '1030' })
      ).rejects.toThrow();
    });

    it('Normal create → accept → back-overlap create should fail', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      await expect(
        create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'Y', description: 'Y', date: '20251224', startTime: '1030', endTime: '1130' })
      ).rejects.toThrow();
    });

    it('Normal create → accept → inside create should fail', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1200' });
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      await expect(
        create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'Z', description: 'Z', date: '20251224', startTime: '1030', endTime: '1100' })
      ).rejects.toThrow();
    });

    it('Normal create → accept → wrapping create should fail', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      await expect(
        create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'W', description: 'W', date: '20251224', startTime: '0930', endTime: '1130' })
      ).rejects.toThrow();
    });

    it('Normal create → accept → non-overlap create succeeds and can be accepted', async () => {
      const a = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'A', description: 'A', date: '20251224', startTime: '1000', endTime: '1100' });
      await controller.patchStatus(a.uuid, ReservationStatus.accept, false);
      const b = await create({ equipments: [equipment.uuid], owner: EquipOwner.dongyeon, phone: '010', title: 'B', description: 'B', date: '20251224', startTime: '1100', endTime: '1200' });
      await expect(
        controller.patchStatus(b.uuid, ReservationStatus.accept, false)
      ).resolves.toBeUndefined();
    });
  });
});


