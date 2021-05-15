import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";
import {ReservationStatus} from "../reservation.meta";

@Entity()
export class ReserveEquip extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column('simple-array', {nullable: false})
  equips: string[]; // 장비의 uuid

  @Column({nullable: false})
  user: string; // 예약한 유저의 uuid

  @Column({nullable: false})
  owner: string; // 장비의 owner

  @Column({nullable: false})
  phone: string; // 010-xxxx-xxxx

  @Column({nullable: false})
  title: string;

  @Column({nullable: false})
  description: string;

  @Column({nullable: false})
  date: number; // yyyy-MM-dd

  @Column({nullable: false})
  startTime: number; // hh:mm

  @Column({nullable: false})
  endTime: number; // hh:mm

  @Column({nullable: false, default: ReservationStatus.in_process})
  reserveStatus: ReservationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
