import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserStatus, UserType } from './user.meta';

@Entity()
@Unique(['email', 'id'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  id: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  cryptoSalt: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  userType: UserType;

  @Column({ nullable: false, default: UserStatus.deactivated })
  userStatus: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  lastLoginAt: Date;
}
