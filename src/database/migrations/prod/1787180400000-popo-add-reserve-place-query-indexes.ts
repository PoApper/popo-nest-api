import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopoAddReservePlaceQueryIndexes1787180400000
  implements MigrationInterface
{
  name = 'PopoAddReservePlaceQueryIndexes1787180400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX `IDX_reserve_place_place_id_date` ON `reserve_place` (`place_id`, `date`)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_reserve_place_date_start_time_status` ON `reserve_place` (`date`, `start_time`, `status`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX `IDX_reserve_place_date_start_time_status` ON `reserve_place`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_reserve_place_place_id_date` ON `reserve_place`',
    );
  }
}
