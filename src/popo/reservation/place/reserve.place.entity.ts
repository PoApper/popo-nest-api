import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReservationStatus } from '../reservation.meta';

@Entity()
export class ReservePlace extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  place: string; // 장소의 uuid // TODO: deprecate

  @Column({ nullable: false })
  user: string; // 예약한 유저의 uuid

  @Column({ nullable: false })
  phone: string; // 010-xxxx-xxxx

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: false })
  date: string; // YYYYMMDD

  @Column({ nullable: false })
  startTime: number; // hh:mm

  @Column({ nullable: false })
  endTime: number; // hh:mm

  @Column({ nullable: false, default: ReservationStatus.in_process })
  status: ReservationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
