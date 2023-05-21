import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PasswordChangeRequestStatus } from './password-change-request.type';

@Entity({ name: 'password_change_request' })
export class PasswordChangeRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  user_uuid: string;

  @Column({ nullable: false, default: PasswordChangeRequestStatus.ISSUED })
  status: PasswordChangeRequestStatus;

  @CreateDateColumn()
  created_at: Date;
}
