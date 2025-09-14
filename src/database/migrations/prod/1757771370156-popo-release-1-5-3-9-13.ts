import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoRelease1539131757771370156 implements MigrationInterface {
    name = 'PopoRelease1539131757771370156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nickname\` DROP FOREIGN KEY \`FK_30b488b4298d857c45e04e6ec52\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` DROP FOREIGN KEY \`FK_0a9a65f3c7649c91ca60aedf536\``);
        await queryRunner.query(`DROP INDEX \`IDX_30b488b4298d857c45e04e6ec5\` ON \`nickname\``);
        await queryRunner.query(`DROP INDEX \`REL_30b488b4298d857c45e04e6ec5\` ON \`nickname\``);
        await queryRunner.query(`DROP INDEX \`IDX_6e9c98fcda8bae19d7939a59f4\` ON \`fcm_key\``);
        await queryRunner.query(`ALTER TABLE \`whitebook\` DROP COLUMN \`content\``);
        await queryRunner.query(`ALTER TABLE \`whitebook\` ADD \`content\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`nickname\` ADD UNIQUE INDEX \`IDX_6406e4d246bfcc619942095254\` (\`user_uuid\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`last_login_at\` \`last_login_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`content\` \`content\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`affiliate\` CHANGE \`content\` \`content\` text NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_6406e4d246bfcc619942095254\` ON \`nickname\` (\`user_uuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_512b843d175b02aa7f78ce0d22\` ON \`fcm_key\` (\`user_uuid\`, \`push_key\`)`);
        await queryRunner.query(`ALTER TABLE \`nickname\` ADD CONSTRAINT \`FK_6406e4d246bfcc6199420952541\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` ADD CONSTRAINT \`FK_dea9472e4a513d65e387f225d6c\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`fcm_key\` DROP FOREIGN KEY \`FK_dea9472e4a513d65e387f225d6c\``);
        await queryRunner.query(`ALTER TABLE \`nickname\` DROP FOREIGN KEY \`FK_6406e4d246bfcc6199420952541\``);
        await queryRunner.query(`DROP INDEX \`IDX_512b843d175b02aa7f78ce0d22\` ON \`fcm_key\``);
        await queryRunner.query(`DROP INDEX \`REL_6406e4d246bfcc619942095254\` ON \`nickname\``);
        await queryRunner.query(`ALTER TABLE \`affiliate\` CHANGE \`content\` \`content\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`discount\` CHANGE \`content\` \`content\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`last_login_at\` \`last_login_at\` datetime NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nickname\` DROP INDEX \`IDX_6406e4d246bfcc619942095254\``);
        await queryRunner.query(`ALTER TABLE \`whitebook\` DROP COLUMN \`content\``);
        await queryRunner.query(`ALTER TABLE \`whitebook\` ADD \`content\` mediumtext NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_6e9c98fcda8bae19d7939a59f4\` ON \`fcm_key\` (\`push_key\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_30b488b4298d857c45e04e6ec5\` ON \`nickname\` (\`user_uuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_30b488b4298d857c45e04e6ec5\` ON \`nickname\` (\`user_uuid\`)`);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` ADD CONSTRAINT \`FK_0a9a65f3c7649c91ca60aedf536\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`nickname\` ADD CONSTRAINT \`FK_30b488b4298d857c45e04e6ec52\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
