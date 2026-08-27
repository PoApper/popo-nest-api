import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoSupportLongUrl08271787814800000 implements MigrationInterface {
    name = 'PopoSupportLongUrl08271787814800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`image_url\` \`image_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`homepage_url\` \`homepage_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`facebook_url\` \`facebook_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`instagram_url\` \`instagram_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`youtube_url\` \`youtube_url\` text NULL`);

        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`image_url\` \`image_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`homepage_url\` \`homepage_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`facebook_url\` \`facebook_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`instagram_url\` \`instagram_url\` text NULL`);

        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`image_url\` \`image_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`homepage_url\` \`homepage_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`facebook_url\` \`facebook_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`instagram_url\` \`instagram_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`youtube_url\` \`youtube_url\` text NULL`);

        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`image_url\` \`image_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`link\` \`link\` text NULL`);

        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`image_url\` \`image_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`image_url\` \`image_url\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`whitebook\` CHANGE \`link\` \`link\` text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`whitebook\` CHANGE \`link\` \`link\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);

        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`link\` \`link\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);

        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`youtube_url\` \`youtube_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`instagram_url\` \`instagram_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`facebook_url\` \`facebook_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`homepage_url\` \`homepage_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_student_association\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);

        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`instagram_url\` \`instagram_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`facebook_url\` \`facebook_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`homepage_url\` \`homepage_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);

        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`youtube_url\` \`youtube_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`instagram_url\` \`instagram_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`facebook_url\` \`facebook_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`homepage_url\` \`homepage_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
    }
}
