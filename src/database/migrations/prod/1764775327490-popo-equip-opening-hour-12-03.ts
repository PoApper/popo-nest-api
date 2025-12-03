import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoEquipOpeningHour12031764775327490 implements MigrationInterface {
    name = 'PopoEquipOpeningHour12031764775327490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`equip\` ADD \`opening_hours\` text NOT NULL DEFAULT '{"Everyday":"00:00-24:00"}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`equip\` DROP COLUMN \`opening_hours\``);
    }

}
