import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoAddStudentAssociationTable01031767430024227 implements MigrationInterface {
    name = 'PopoAddStudentAssociationTable01031767430024227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`intro_student_association\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`uuid\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`content\` text NULL, \`short_desc\` varchar(255) NOT NULL, \`location\` varchar(255) NULL, \`representative\` varchar(255) NOT NULL, \`office\` varchar(255) NULL, \`contact\` varchar(255) NOT NULL, \`image_url\` varchar(255) NULL, \`views\` int NOT NULL DEFAULT '0', \`homepage_url\` varchar(255) NULL, \`facebook_url\` varchar(255) NULL, \`instagram_url\` varchar(255) NULL, \`youtube_url\` varchar(255) NULL, PRIMARY KEY (\`uuid\`, \`name\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` DROP COLUMN \`association_type\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_association\` ADD \`association_type\` varchar(255) NOT NULL`);
        await queryRunner.query(`DROP TABLE \`intro_student_association\``);
    }

}
