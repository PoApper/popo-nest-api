import { MigrationInterface, QueryRunner } from "typeorm";

export class PopoRenameTypeormEntities09071757233580141 implements MigrationInterface {
    name = 'PopoRenameTypeormEntities09071757233580141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_6406e4d246bfcc619942095254\` ON \`nickname\` (\`user_uuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_512b843d175b02aa7f78ce0d22\` ON \`fcm_key\` (\`user_uuid\`, \`push_key\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_512b843d175b02aa7f78ce0d22\` ON \`fcm_key\``);
        await queryRunner.query(`DROP INDEX \`IDX_6406e4d246bfcc619942095254\` ON \`nickname\``);
    }

}
