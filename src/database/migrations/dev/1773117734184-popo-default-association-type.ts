import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoDefaultAssociationType1773117734184 implements MigrationInterface {
    name = 'PopoDefaultAssociationType1773117734184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`association_type\` \`association_type\` varchar(255) NOT NULL DEFAULT '기타'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`association_type\` \`association_type\` varchar(255) NOT NULL`);
    }

}
