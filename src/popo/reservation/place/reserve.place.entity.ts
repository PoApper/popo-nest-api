import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReservationStatus } from '../reservation.meta';
import { User } from '../../user/user.entity';

@Entity()
export class ReservePlace extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  place: string; // 장소의 uuid // TODO: deprecate

  @Column({ nullable: true })
  booker_id: string; // uuid of booker

  @Column({ nullable: false })
  phone: string; // 010-xxxx-xxxx

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: false })
  date: string; // YYYYMMDD

  @Column({ nullable: false })
  start_time: number; // hh:mm

  @Column({ nullable: false })
  end_time: number; // hh:mm

  @Column({ nullable: false, default: ReservationStatus.in_process })
  status: ReservationStatus;

  @CreateDateColumn()
  created_at: Date;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.place_reservation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booker_id' })
  booker: User;
}
