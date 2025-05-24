import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { User } from './user.entity';
@Entity('nickname')
export class Nickname {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ type: 'uuid', nullable: false, unique: true })
  userUuid: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  nickname: string;

  @OneToOne(() => User, (user) => user.nickname, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid' })
  @ApiHideProperty()
  user: User;

  @CreateDateColumn()
  @ApiHideProperty()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiHideProperty()
  @Exclude()
  updatedAt: Date;
}
