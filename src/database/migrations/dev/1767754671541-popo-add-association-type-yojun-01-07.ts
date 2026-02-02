import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoAddAssociationTypeYojun01071767754671541 implements MigrationInterface {
    name = 'PopoAddAssociationTypeYojun01071767754671541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_association\` ADD \`association_type\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_association\` DROP COLUMN \`association_type\``);
    }

}
