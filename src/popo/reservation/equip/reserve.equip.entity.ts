import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReservationStatus } from '../reservation.meta';
import { EquipOwner } from '../../equip/equip.meta';

@Entity()
export class ReserveEquip extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column('simple-array', { nullable: false })
  equips: string[]; // 장비의 uuid

  @Column({ nullable: false })
  user: string; // 예약한 유저의 uuid

  @Column({ nullable: false })
  owner: EquipOwner; // 장비의 owner

  @Column({ nullable: false })
  phone: string; // 010-xxxx-xxxx

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: false })
  // TODO: migration into YYYY.MM.DD
  date: number; // yyyyMMdd

  @Column({ nullable: false })
  // TODO: migration into HH:MM
  startTime: number; // hhmm

  @Column({ nullable: false })
  // TODO: migration into HH:MM
  endTime: number; // hhmm

  @Column({ nullable: false, default: ReservationStatus.in_process })
  reserveStatus: ReservationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
