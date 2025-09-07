import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReservationStatus } from '../reservation.meta';
import { EquipOwner } from '../../equip/equip.meta';
import { User } from '../../user/user.entity';
import { Base } from '../../../common/base.entity';

@Entity()
export class ReserveEquip extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column('simple-array', { nullable: false })
  equipments: string[]; // Array of equipment uuids

  @Column({ name: 'booker_id', nullable: true })
  bookerId: string; // uuid of booker

  @Column({ nullable: false })
  owner: EquipOwner; // 장비의 owner

  @Column({ nullable: false })
  phone: string; // 010-xxxx-xxxx

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: false })
  date: string; // YYYYMMDD

  @Column({ name: 'start_time', nullable: false })
  startTime: string; // HHmm

  @Column({ name: 'end_time', nullable: false })
  endTime: string; // HHmm

  @Column({ nullable: false, default: ReservationStatus.in_process })
  status: ReservationStatus;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.equipReservation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booker_id' })
  booker: User;
}
