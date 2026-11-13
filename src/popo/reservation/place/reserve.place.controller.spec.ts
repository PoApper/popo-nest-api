import { Test, TestingModule } from '@nestjs/testing';
import { ReservePlaceController } from './reserve.place.controller';
import { ReservePlaceService } from './reserve.place.service';
import { PlaceService } from '../../place/place.service';
import { MailService } from '../../../mail/mail.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('ReservePlaceController (mail integration)', () => {
  let controller: ReservePlaceController;
  let reservePlaceService: DeepMocked<ReservePlaceService>;
  let placeService: DeepMocked<PlaceService>;
  let mailService: DeepMocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservePlaceController],
      providers: [
        {
          provide: ReservePlaceService,
          useValue: createMock<ReservePlaceService>(),
        },
        { provide: PlaceService, useValue: createMock<PlaceService>() },
        { provide: MailService, useValue: createMock<MailService>() },
      ],
    }).compile();

    controller = module.get(ReservePlaceController);
    reservePlaceService = module.get(ReservePlaceService);
    placeService = module.get(PlaceService);
    mailService = module.get(MailService);
  });

  it('should send emails to staff and booker when reservation is created', async () => {
    const user = { uuid: 'u1', email: 'booker@example.com' } as any;
    const dto = {
      placeId: 'p1',
      date: '20240101',
      startTime: '1000',
      endTime: '1100',
      title: '회의',
    } as any;
    const place = {
      uuid: 'p1',
      name: '회의실',
      staffEmail: 'staff@example.com',
    } as any;
    const saved = { uuid: 'r1', ...dto, bookerId: user.uuid } as any;

    placeService.findOneByUuidOrFail.mockResolvedValue(place);
    reservePlaceService.checkReservationPossible.mockResolvedValue(true as any);
    reservePlaceService.save.mockResolvedValue(saved);
    placeService.updateReservationCountByDelta.mockResolvedValue(undefined);
    mailService.sendPlaceReserveCreateMailToStaff.mockResolvedValue(undefined);
    mailService.sendPlaceReserveCreateMailToBooker.mockResolvedValue(undefined);

    const result = await controller.createWithNameAndId(user, dto);

    expect(result).toBe(saved);
    expect(mailService.sendPlaceReserveCreateMailToStaff).toHaveBeenCalledWith(
      place.staffEmail,
      place,
      saved,
    );
    expect(mailService.sendPlaceReserveCreateMailToBooker).toHaveBeenCalledWith(
      user.email,
      place,
      saved,
    );
  });

  it('should load booker and place relations in the reservation list query', async () => {
    const reservations = [{ uuid: 'r1' }] as any;
    reservePlaceService.findAllWithRelations.mockResolvedValue(reservations);

    const result = await controller.getAll(undefined, undefined, 0, 10);

    expect(result).toBe(reservations);
    expect(reservePlaceService.findAllWithRelations).toHaveBeenCalledWith(
      {
        status: undefined,
        date: undefined,
        placeId: undefined,
        bookerId: undefined,
        title: undefined,
        startDate: undefined,
        endDate: undefined,
        orderBy: undefined,
        orderDirection: undefined,
      },
      { skip: 0, take: 10 },
    );
    expect(reservePlaceService.joinBooker).not.toHaveBeenCalled();
    expect(reservePlaceService.joinPlace).not.toHaveBeenCalled();
  });
});
