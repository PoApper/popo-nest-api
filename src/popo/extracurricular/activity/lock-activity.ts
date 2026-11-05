import { NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Activity } from './activity.entity';

/** A no-op UPDATE takes an exclusive row lock on MySQL and works on SQLite. */
export async function lockActivity(manager: EntityManager, uuid: string) {
  await manager
    .createQueryBuilder()
    .update(Activity)
    .set({ uuid, updatedAt: () => 'updated_at' })
    .where({ uuid })
    .execute();
  if (!(await manager.findOneBy(Activity, { uuid }))) {
    throw new NotFoundException('존재하지 않는 비교과활동입니다.');
  }
}
