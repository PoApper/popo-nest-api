import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { User } from './user.entity';
import { Base } from '../../common/base.entity';
@Entity()
export class Nickname extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false, unique: true })
  userUuid: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  nickname: string;

  @OneToOne(() => User, (user) => user.nickname, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  @ApiHideProperty()
  user: User;
}
