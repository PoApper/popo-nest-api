import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoReservationRequiredDays05121778546890859 implements MigrationInterface {
    name = 'PopoReservationRequiredDays05121778546890859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`place\` ADD \`reservation_required_days\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`equip\` ADD \`reservation_required_days\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`equip\` DROP COLUMN \`reservation_required_days\``);
        await queryRunner.query(`ALTER TABLE \`place\` DROP COLUMN \`reservation_required_days\``);
    }

}
