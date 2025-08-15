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

  @Column({ nullable: false })
  userUuid: string;

  @Column({ nullable: false, unique: true })
  pushKey: string;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.push_keys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid', referencedColumnName: 'uuid' })
  @ApiHideProperty()
  user: User;
}
