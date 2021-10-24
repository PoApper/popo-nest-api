import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReservationStatus } from '../reservation.meta';
import { EquipOwner } from '../../equip/equip.meta';
import { User } from '../../user/user.entity';

@Entity()
export class ReserveEquip extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column('simple-array', { nullable: false })
  equipments: string[]; // 장비의 uuid

  @Column({ nullable: true })
  booker_id: string; // 예약한 유저의 uuid

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

  @Column({ nullable: false })
  // TODO: migration into HH:MM
  start_time: number; // hhmm

  @Column({ nullable: false })
  // TODO: migration into HH:MM
  end_time: number; // hhmm

  @Column({ nullable: false, default: ReservationStatus.in_process })
  status: ReservationStatus;

  @CreateDateColumn()
  created_at: Date;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.equip_reservation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booker_id' })
  booker: User;
}
