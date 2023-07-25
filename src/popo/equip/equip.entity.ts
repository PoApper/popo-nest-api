import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EquipOwner } from './equip.meta';

@Entity()
export class Equip extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: false })
  fee: number;

  @Column({ nullable: false })
  equip_owner: EquipOwner;

  @Column({ nullable: true })
  staff_email: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ default: 24 * 60 })
  max_minutes: number;

  @Column({ default: 0 })
  total_reservation_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
