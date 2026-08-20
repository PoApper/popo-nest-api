import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoAddTypeToAssociationTable01021767268527172 implements MigrationInterface {
    name = 'PopoAddTypeToAssociationTable01021767268527172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_association\` ADD \`association_type\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_association\` DROP COLUMN \`association_type\``);
    }

}
