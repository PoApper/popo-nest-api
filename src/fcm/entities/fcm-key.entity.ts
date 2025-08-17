import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '../../popo/user/user.entity';
import { Base } from '../../common/base.entity';

@Entity()
export class FcmKey extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ name: 'user_uuid', nullable: false })
  userUuid: string;

  @Column({ name: 'push_key', nullable: false, unique: true })
  pushKey: string;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.push_keys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  @ApiHideProperty()
  user: User;
}
