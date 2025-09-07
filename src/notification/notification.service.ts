import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';

import { FcmService } from '../fcm/fcm.service';
import { ReservePlace } from '../popo/reservation/place/reserve.place.entity';
import { ReserveEquip } from '../popo/reservation/equip/reserve.equip.entity';
import { ReservationStatus } from '../popo/reservation/reservation.meta';
import { EquipService } from '../popo/equip/equip.service';

export enum NotificationType {
  PLACE_RESERVATION = 'place_reservation',
  EQUIP_RESERVATION = 'equip_reservation',
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(ReservePlace)
    private readonly reservePlaceRepository: Repository<ReservePlace>,
    @InjectRepository(ReserveEquip)
    private readonly reserveEquipRepository: Repository<ReserveEquip>,
    private readonly fcmService: FcmService,
    private readonly equipService: EquipService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingReservations() {
    // 15분 전 예약 탐색
    const now = moment();
    const fifteenMinutesLater = now.clone().add(15, 'minutes');
    const targetTime = fifteenMinutesLater.format('HHmm');

    // 오늘 또는 내일 예약
    let targetDate = now.format('YYYYMMDD');

    // 15분 전 예약이 오늘 시간보다 작으면 내일 예약 탐색
    if (parseInt(targetTime) < 15) {
      targetDate = now.clone().add(1, 'day').format('YYYYMMDD');
    }

    await this.checkUpcomingPlaceReservations(targetDate, targetTime);
    await this.checkUpcomingEquipReservations(targetDate, targetTime);
  }

  private async checkUpcomingPlaceReservations(
    date: string,
    targetTime: string,
  ) {
    try {
      const placeReservations = await this.reservePlaceRepository.find({
        where: {
          date: date,
          startTime: targetTime,
          status: ReservationStatus.accept,
        },
        relations: ['booker', 'place'],
      });

      for (const reservation of placeReservations) {
        if (reservation.booker) {
          const body = `${reservation.place?.name || '예약된 장소'}에 대한 예약이 15분 후에 시작됩니다.`;
          await this.fcmService.sendPushNotificationByUserUuid(
            reservation.bookerId,
            '장소 예약 알림',
            body,
            {
              type: NotificationType.PLACE_RESERVATION,
              reservationId: reservation.uuid,
            },
          );

          this.logger.debug(
            `장소 예약 알림 전송 성공. userUuid: ${reservation.bookerId}, body: ${body}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('장소 예약 알림 전송 실패', error);
    }
  }

  private async checkUpcomingEquipReservations(
    date: string,
    targetTime: string,
  ) {
    try {
      const equipReservations = await this.reserveEquipRepository.find({
        where: {
          date: date,
          startTime: targetTime,
          status: ReservationStatus.accept,
        },
        relations: ['booker'],
      });

      for (const reservation of equipReservations) {
        const targetEquipments = await this.equipService.findByIds(
          reservation.equipments,
        );
        const body = `${targetEquipments.map((equip) => equip.name).join(', ') || '예약된 장비'}에 대한 예약이 15분 후에 시작됩니다.`;

        if (reservation.booker) {
          await this.fcmService.sendPushNotificationByUserUuid(
            reservation.bookerId,
            '장비 예약 알림',
            body,
            {
              type: NotificationType.EQUIP_RESERVATION,
              reservationId: reservation.uuid,
            },
          );

          this.logger.debug(
            `장비 예약 알림 전송 성공. userUuid: ${reservation.bookerId}, body: ${body}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('장비 예약 알림 전송 실패', error);
    }
  }
}
