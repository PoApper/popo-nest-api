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
  imageName: string;

  @Column({ default: null })
  max_minutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
