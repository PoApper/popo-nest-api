import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoPr214Generated1790489267627 implements MigrationInterface {
    name = 'PopoPr214Generated1790489267627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`activity\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`uuid\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`period\` varchar(255) NOT NULL, \`target\` varchar(255) NOT NULL, \`applicationMethod\` text NOT NULL, \`description\` text NOT NULL, \`category\` varchar(255) NOT NULL, \`iconName\` varchar(255) NOT NULL DEFAULT 'BookOpen', PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`activity_report\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`uuid\` varchar(36) NOT NULL, \`activityId\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`period\` varchar(255) NOT NULL, \`grade\` varchar(255) NOT NULL, \`major\` varchar(255) NOT NULL, \`author\` varchar(255) NOT NULL, \`memo\` text NULL, \`fileName\` varchar(255) NOT NULL, \`fileType\` varchar(255) NOT NULL DEFAULT 'pdf', \`fileKey\` varchar(255) NULL, \`fileUrl\` varchar(255) NULL, PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`report_file_deletion\` (\`fileKey\` varchar(255) NOT NULL, \`lastAttemptAt\` bigint NOT NULL DEFAULT '0', PRIMARY KEY (\`fileKey\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`activity_report\` ADD CONSTRAINT \`FK_5138989681e88c0a63121adbc06\` FOREIGN KEY (\`activityId\`) REFERENCES \`activity\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`activity_report\` DROP FOREIGN KEY \`FK_5138989681e88c0a63121adbc06\``);
        await queryRunner.query(`DROP TABLE \`report_file_deletion\``);
        await queryRunner.query(`DROP TABLE \`activity_report\``);
        await queryRunner.query(`DROP TABLE \`activity\``);
    }

}
