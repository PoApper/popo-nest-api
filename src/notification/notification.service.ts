import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';

import { FcmService } from '../fcm/fcm.service';
import { ReservePlace } from '../popo/reservation/place/reserve.place.entity';
import { ReserveEquip } from '../popo/reservation/equip/reserve.equip.entity';
import { ReservationStatus } from '../popo/reservation/reservation.meta';

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
  ) {}

  // Run every minute to check for reservations that are 15 minutes away
  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingReservations() {
    this.logger.log('Checking for upcoming reservations...');

    // 1. Calculate timestamp 15 minutes ahead
    const now = moment();
    const currentTime = now.format('HHmm');
    const fifteenMinutesLater = now.clone().add(15, 'minutes');
    const targetTime = fifteenMinutesLater.format('HHmm');

    // 2. Determine the date to check (today or tomorrow if needed)
    let targetDate = now.format('YYYYMMDD');

    // If target time is less than 0015, it means we've crossed to the next day
    if (parseInt(targetTime) < 15) {
      targetDate = now.clone().add(1, 'day').format('YYYYMMDD');
      this.logger.log(
        `Target time ${targetTime} is in the next day. Using date: ${targetDate}`,
      );
    }

    this.logger.log(
      `Current time: ${currentTime}, checking for reservations at ${targetTime} on ${targetDate}`,
    );

    // 3. Check for place reservations
    await this.checkUpcomingPlaceReservations(targetDate, targetTime);

    // 4. Check for equipment reservations
    await this.checkUpcomingEquipReservations(targetDate, targetTime);
  }

  private async checkUpcomingPlaceReservations(
    date: string,
    targetTime: string,
  ) {
    try {
      // Query reservations that match the target date and time
      const placeReservations = await this.reservePlaceRepository.find({
        where: {
          date: date,
          start_time: targetTime,
          status: ReservationStatus.accept,
        },
        relations: ['booker', 'place'],
      });

      this.logger.log(
        `Found ${placeReservations.length} place reservations for date ${date} at time ${targetTime}`,
      );

      // Send notifications for matching reservations
      for (const reservation of placeReservations) {
        this.logger.log(
          `Sending notification for place reservation ${reservation.uuid} (starts at ${reservation.start_time})`,
        );

        // Send notification to the booker
        if (reservation.booker) {
          await this.fcmService.sendPushNotificationByUserUuid(
            reservation.booker_id,
            '장소 예약 알림',
            `${reservation.place?.name || '예약된 장소'}에 대한 예약이 15분 후에 시작됩니다.`,
            {
              type: NotificationType.PLACE_RESERVATION,
              reservationId: reservation.uuid,
            },
          );

          this.logger.log(
            `Notification sent for place reservation ${reservation.uuid}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error checking place reservations', error);
    }
  }

  private async checkUpcomingEquipReservations(
    date: string,
    targetTime: string,
  ) {
    try {
      // Query reservations that match the target date and time
      const equipReservations = await this.reserveEquipRepository.find({
        where: {
          date: date,
          start_time: targetTime,
          status: ReservationStatus.accept,
        },
        relations: ['booker'],
      });

      this.logger.log(
        `Found ${equipReservations.length} equipment reservations for date ${date} at time ${targetTime}`,
      );

      // Send notifications for matching reservations
      for (const reservation of equipReservations) {
        this.logger.log(
          `Sending notification for equipment reservation ${reservation.uuid} (starts at ${reservation.start_time})`,
        );

        // Send notification to the booker
        if (reservation.booker) {
          await this.fcmService.sendPushNotificationByUserUuid(
            reservation.booker_id,
            '장비 예약 알림',
            `예약하신 장비 사용이 15분 후에 시작됩니다.`,
            {
              type: NotificationType.EQUIP_RESERVATION,
              reservationId: reservation.uuid,
            },
          );

          this.logger.log(
            `Notification sent for equipment reservation ${reservation.uuid}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error checking equipment reservations', error);
    }
  }
}
