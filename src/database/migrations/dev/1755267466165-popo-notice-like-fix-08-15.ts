import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoNoticeLikeFix08151755267466165 implements MigrationInterface {
    name = 'PopoNoticeLikeFix08151755267466165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notice_like\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` DROP FOREIGN KEY \`FK_1a21707561c620b45da2dc7e490\``);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` CHANGE \`booker_id\` \`booker_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`hashed_refresh_token\` \`hashed_refresh_token\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`refresh_token_expires_at\` \`refresh_token_expires_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`last_login_at\` \`last_login_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` DROP FOREIGN KEY \`FK_ccafe6dd7a565b48b180aaa89d0\``);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` DROP FOREIGN KEY \`FK_c8a3a7bb2076a4a2105d3573612\``);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`place_id\` \`place_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`booker_id\` \`booker_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`location\` \`location\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`staff_email\` \`staff_email\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`opening_hours\` \`opening_hours\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`whitebook\` CHANGE \`content\` \`content\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`content\` \`content\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`link\` \`link\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`calendar\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`staff_email\` \`staff_email\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`content\` \`content\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`homepage_url\` \`homepage_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`facebook_url\` \`facebook_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`instagram_url\` \`instagram_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`region\` \`region\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`open_hour\` \`open_hour\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`phone\` \`phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`affiliate\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`affiliate\` CHANGE \`content_short\` \`content_short\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`content\` \`content\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`homepage_url\` \`homepage_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`facebook_url\` \`facebook_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`instagram_url\` \`instagram_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`youtube_url\` \`youtube_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` ADD CONSTRAINT \`FK_1a21707561c620b45da2dc7e490\` FOREIGN KEY (\`booker_id\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` ADD CONSTRAINT \`FK_ccafe6dd7a565b48b180aaa89d0\` FOREIGN KEY (\`place_id\`) REFERENCES \`place\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` ADD CONSTRAINT \`FK_c8a3a7bb2076a4a2105d3573612\` FOREIGN KEY (\`booker_id\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`reserve_place\` DROP FOREIGN KEY \`FK_c8a3a7bb2076a4a2105d3573612\``);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` DROP FOREIGN KEY \`FK_ccafe6dd7a565b48b180aaa89d0\``);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` DROP FOREIGN KEY \`FK_1a21707561c620b45da2dc7e490\``);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`youtube_url\` \`youtube_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`instagram_url\` \`instagram_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`facebook_url\` \`facebook_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`homepage_url\` \`homepage_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_club\` CHANGE \`content\` \`content\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`affiliate\` CHANGE \`content_short\` \`content_short\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`affiliate\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`phone\` \`phone\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`open_hour\` \`open_hour\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`region\` \`region\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`instagram_url\` \`instagram_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`facebook_url\` \`facebook_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`homepage_url\` \`homepage_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`intro_association\` CHANGE \`content\` \`content\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`staff_email\` \`staff_email\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`equip\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`calendar\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`link\` \`link\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`notice\` CHANGE \`content\` \`content\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`whitebook\` CHANGE \`content\` \`content\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`opening_hours\` \`opening_hours\` text NOT NULL DEFAULT ''{"Everyday":"00:00-24:00"}''`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`staff_email\` \`staff_email\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`location\` \`location\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`place\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`booker_id\` \`booker_id\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`place_id\` \`place_id\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` ADD CONSTRAINT \`FK_c8a3a7bb2076a4a2105d3573612\` FOREIGN KEY (\`booker_id\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reserve_place\` ADD CONSTRAINT \`FK_ccafe6dd7a565b48b180aaa89d0\` FOREIGN KEY (\`place_id\`) REFERENCES \`place\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`last_login_at\` \`last_login_at\` datetime NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`refresh_token_expires_at\` \`refresh_token_expires_at\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`hashed_refresh_token\` \`hashed_refresh_token\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` CHANGE \`booker_id\` \`booker_id\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reserve_equip\` ADD CONSTRAINT \`FK_1a21707561c620b45da2dc7e490\` FOREIGN KEY (\`booker_id\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notice_like\` DROP COLUMN \`updated_at\``);
    }

}
