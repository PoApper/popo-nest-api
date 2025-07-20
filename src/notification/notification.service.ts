import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';

import { FcmService } from '../fcm/fcm.service';
import { ReservePlace } from '../popo/reservation/place/reserve.place.entity';
import { ReserveEquip } from '../popo/reservation/equip/reserve.equip.entity';
import { ReservationStatus } from '../popo/reservation/reservation.meta';
import {
  NotificationRecord,
  NotificationType,
} from './entities/notification-record.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(ReservePlace)
    private readonly reservePlaceRepository: Repository<ReservePlace>,
    @InjectRepository(ReserveEquip)
    private readonly reserveEquipRepository: Repository<ReserveEquip>,
    @InjectRepository(NotificationRecord)
    private readonly notificationRecordRepository: Repository<NotificationRecord>,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * Check if a notification has already been sent for a reservation
   */
  private async hasNotificationBeenSent(
    reservationId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const record = await this.notificationRecordRepository.findOne({
      where: {
        reservationId,
        type,
        sent: true,
      },
    });
    return !!record;
  }

  /**
   * Create a notification record
   */
  private async createNotificationRecord(
    reservationId: string,
    type: NotificationType,
  ): Promise<NotificationRecord> {
    const record = new NotificationRecord();
    record.reservationId = reservationId;
    record.type = type;
    record.sent = true;
    return await record.save();
  }

  // Run every minute to check for reservations that are 15 minutes away
  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingReservations() {
    this.logger.log('Checking for upcoming reservations...');

    const now = moment();
    const today = now.format('YYYYMMDD');
    const currentTime = now.format('HHmm');

    // Check for place reservations
    await this.checkUpcomingPlaceReservations(today, currentTime);

    // Check for equipment reservations
    await this.checkUpcomingEquipReservations(today, currentTime);
  }

  private async checkUpcomingPlaceReservations(
    today: string,
    currentTime: string,
  ) {
    try {
      // Find place reservations for today with status 'accept'
      const placeReservations = await this.reservePlaceRepository.find({
        where: {
          date: today,
          status: ReservationStatus.accept,
        },
        relations: ['booker', 'place'],
      });

      for (const reservation of placeReservations) {
        // Calculate if the reservation is 15 minutes away
        const reservationTime = moment(reservation.start_time, 'HHmm');
        const fifteenMinutesBefore = moment(currentTime, 'HHmm').add(
          15,
          'minutes',
        );

        // If the reservation starts in exactly 15 minutes
        if (
          reservationTime.format('HHmm') === fifteenMinutesBefore.format('HHmm')
        ) {
          // Check if notification has already been sent
          const alreadySent = await this.hasNotificationBeenSent(
            reservation.uuid,
            NotificationType.PLACE_RESERVATION,
          );

          if (!alreadySent) {
            this.logger.log(
              `Sending notification for place reservation ${reservation.uuid}`,
            );

            // Send notification to the booker
            if (reservation.booker) {
              await this.fcmService.sendPushNotificationByUserUuid(
                reservation.booker_id,
                '장소 예약 알림',
                `${reservation.place?.name || '예약된 장소'}에 대한 예약이 15분 후에 시작됩니다.`,
                {
                  type: 'place_reservation',
                  reservationId: reservation.uuid,
                },
              );

              // Create notification record
              await this.createNotificationRecord(
                reservation.uuid,
                NotificationType.PLACE_RESERVATION,
              );

              this.logger.log(
                `Notification record created for place reservation ${reservation.uuid}`,
              );
            }
          } else {
            this.logger.log(
              `Notification already sent for place reservation ${reservation.uuid}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking place reservations', error);
    }
  }

  private async checkUpcomingEquipReservations(
    today: string,
    currentTime: string,
  ) {
    try {
      // Find equipment reservations for today with status 'accept'
      const equipReservations = await this.reserveEquipRepository.find({
        where: {
          date: today,
          status: ReservationStatus.accept,
        },
        relations: ['booker'],
      });

      for (const reservation of equipReservations) {
        // Calculate if the reservation is 15 minutes away
        const reservationTime = moment(reservation.start_time, 'HHmm');
        const fifteenMinutesBefore = moment(currentTime, 'HHmm').add(
          15,
          'minutes',
        );

        // If the reservation starts in exactly 15 minutes
        if (
          reservationTime.format('HHmm') === fifteenMinutesBefore.format('HHmm')
        ) {
          // Check if notification has already been sent
          const alreadySent = await this.hasNotificationBeenSent(
            reservation.uuid,
            NotificationType.EQUIP_RESERVATION,
          );

          if (!alreadySent) {
            this.logger.log(
              `Sending notification for equipment reservation ${reservation.uuid}`,
            );

            // Send notification to the booker
            if (reservation.booker) {
              await this.fcmService.sendPushNotificationByUserUuid(
                reservation.booker_id,
                '장비 예약 알림',
                `예약하신 장비 사용이 15분 후에 시작됩니다.`,
                {
                  type: 'equip_reservation',
                  reservationId: reservation.uuid,
                },
              );

              // Create notification record
              await this.createNotificationRecord(
                reservation.uuid,
                NotificationType.EQUIP_RESERVATION,
              );

              this.logger.log(
                `Notification record created for equipment reservation ${reservation.uuid}`,
              );
            }
          } else {
            this.logger.log(
              `Notification already sent for equipment reservation ${reservation.uuid}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking equipment reservations', error);
    }
  }
}
