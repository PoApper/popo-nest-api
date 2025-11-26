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

  @Column({ name: 'equip_owner', nullable: false })
  equipOwner: EquipOwner;

  @Column({ name: 'staff_email', nullable: true })
  staffEmail: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'max_minutes', default: 24 * 60 })
  maxMinutes: number;

  @Column('text', {
    name: 'opening_hours',
    nullable: false,
    default: '{"Everyday":"00:00-24:00"}',
  })
  openingHours: string;
  // if null, there's no rule for opening hours.
  // checking opening hours is implemented on the frontend side.

  @Column({ name: 'total_reservation_count', default: 0 })
  totalReservationCount: number;
}
