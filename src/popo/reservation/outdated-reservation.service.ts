import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThanOrEqual } from 'typeorm';
import * as moment from 'moment-timezone';

import { ReservePlaceService } from './place/reserve.place.service';
import { ReserveEquipService } from './equip/reserve.equip.service';
import { ReservationStatus } from './reservation.meta';
import { isReservationEndedBefore } from '../../utils/reservation-utils';

export type AutoAcceptSummary = {
  cutoff: string;
  placeAcceptedCount: number;
  equipAcceptedCount: number;
  /** 처리 한도(batchSize)에 걸려 이번 실행에서 남은 건이 있을 수 있음을 알린다. */
  mayHaveMore: boolean;
};

type ReservationLike = {
  uuid: string;
  date: string;
  endTime: string;
};

/**
 * 종료된 지 오래된 "심사중" 예약을 자동으로 승인 처리한다.
 *
 * 예약 종료 시각이 한참 지난 뒤에는 승인/거절이 실질적인 의미가 없는데도
 * "심사중"으로 남아 대기 목록에 수천 건씩 쌓인다. 이 예약들을 자동으로 정리해
 * 관리자가 실제로 판단해야 하는 예약만 남도록 한다.
 *
 * 주의사항
 * - 실제 서비스 데이터를 대량으로 바꾸므로 기본값은 비활성이다.
 *   `AUTO_ACCEPT_OUTDATED_RESERVATIONS=true` 를 설정해야 스케줄러가 동작한다.
 * - 이미 지난 예약이라 동시 예약/겹침 검사를 하지 않는다. 검사를 하면 서로 겹치는
 *   과거 예약들이 영구히 정리되지 않고, 지난 시점의 자리 배정을 지금 다시 판단하는
 *   것도 의미가 없다.
 * - 사용자에게 승인 메일을 보내지 않는다. 지난 예약에 대한 메일은 혼란만 준다.
 */
@Injectable()
export class OutdatedReservationService {
  private readonly logger = new Logger(OutdatedReservationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly reservePlaceService: ReservePlaceService,
    private readonly reserveEquipService: ReserveEquipService,
  ) {}

  private get isEnabled(): boolean {
    return Boolean(
      this.configService.get<boolean>('reservation.autoAcceptOutdated'),
    );
  }

  private get graceHours(): number {
    return (
      this.configService.get<number>('reservation.outdatedGraceHours') ?? 24
    );
  }

  private get batchSize(): number {
    return (
      this.configService.get<number>('reservation.autoAcceptBatchSize') ?? 500
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoAcceptOutdatedReservations() {
    if (!this.isEnabled) {
      return;
    }

    const summary = await this.acceptOutdatedReservations();

    // 처리한 게 없으면 매시간 로그를 남기지 않는다.
    if (summary.placeAcceptedCount || summary.equipAcceptedCount) {
      this.logger.log(
        [
          '[지난 예약 자동 승인]',
          `- 기준 시각: ${summary.cutoff} 이전 종료`,
          `- 장소 예약: ${summary.placeAcceptedCount}건`,
          `- 장비 예약: ${summary.equipAcceptedCount}건`,
          `- 남은 건 있을 수 있음: ${summary.mayHaveMore}`,
        ].join('\n'),
      );
    }
  }

  /**
   * 스케줄러와 관리자 수동 실행이 공유하는 본체.
   * 설정 플래그와 무관하게 동작하므로, 수동 실행으로 한 번만 정리할 수도 있다.
   */
  async acceptOutdatedReservations(): Promise<AutoAcceptSummary> {
    const cutoff = moment().tz('Asia/Seoul').subtract(this.graceHours, 'hours');
    const batchSize = this.batchSize;

    const placeTargets = await this.findOutdatedTargets(
      (findOption) => this.reservePlaceService.find(findOption),
      cutoff,
      batchSize,
    );
    const equipTargets = await this.findOutdatedTargets(
      (findOption) => this.reserveEquipService.find(findOption),
      cutoff,
      batchSize,
    );

    const placeAcceptedCount = await this.reservePlaceService.updateStatusMany(
      placeTargets.uuidList,
      ReservationStatus.accept,
    );
    const equipAcceptedCount = await this.reserveEquipService.updateStatusMany(
      equipTargets.uuidList,
      ReservationStatus.accept,
    );

    return {
      cutoff: cutoff.format('YYYY-MM-DD HH:mm'),
      placeAcceptedCount: placeAcceptedCount,
      equipAcceptedCount: equipAcceptedCount,
      mayHaveMore: placeTargets.reachedLimit || equipTargets.reachedLimit,
    };
  }

  /**
   * 자동 승인 대상 예약을 찾는다.
   *
   * date 컬럼으로 1차 필터를 걸어 조회량을 줄이고, 종료 시각까지 따지는 정밀 판정은
   * 애플리케이션에서 한다. date 가 기준일보다 앞선 예약은 무조건 대상이고,
   * 기준일과 같은 예약만 endTime 을 확인해야 하기 때문이다.
   */
  private async findOutdatedTargets(
    find: (findOption: object) => Promise<ReservationLike[]>,
    cutoff: moment.Moment,
    batchSize: number,
  ): Promise<{ uuidList: string[]; reachedLimit: boolean }> {
    const candidates = await find({
      where: {
        status: ReservationStatus.in_process,
        date: LessThanOrEqual(cutoff.format('YYYYMMDD')),
      },
      order: { date: 'ASC', startTime: 'ASC' },
      take: batchSize,
    });

    const uuidList = candidates
      .filter((reservation) =>
        isReservationEndedBefore(reservation.date, reservation.endTime, cutoff),
      )
      .map((reservation) => reservation.uuid);

    return {
      uuidList: uuidList,
      reachedLimit: candidates.length === batchSize,
    };
  }
}
