import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EquipOwner } from './equip.meta';
import { Base } from '../../common/base.entity';

@Entity()
export class Equip extends Base {
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
}
