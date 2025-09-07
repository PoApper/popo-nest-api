import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PlaceEnableAutoAccept, PlaceRegion } from './place.meta';
import { ReservePlace } from '../reservation/place/reserve.place.entity';
import { Base } from '../../common/base.entity';

@Entity()
export class Place extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: false })
  region: PlaceRegion; // 학생회관 / 지곡 / OTHERS / 커뮤니티 센터

  @Column({ name: 'staff_email', nullable: true })
  staffEmail: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'max_minutes', default: 24 * 60 })
  maxMinutes: number;

  @Column({ name: 'max_concurrent_reservation', default: 1 })
  maxConcurrentReservation: number;

  @Column('text', {
    name: 'opening_hours',
    nullable: false,
    default: '{"Everyday":"00:00-24:00"}',
  })
  openingHours: string;
  // if null, there's no rule for opening hours.
  // checking opening hours is implemented on the frontend side.

  @Column({
    name: 'enable_auto_accept',
    default: PlaceEnableAutoAccept.inactive,
  })
  enableAutoAccept: PlaceEnableAutoAccept;

  @Column({ name: 'total_reservation_count', default: 0 })
  totalReservationCount: number;

  /**
   * Database Relation
   */

  @OneToMany(() => ReservePlace, (placeReservation) => placeReservation.place)
  placeReservation: ReservePlace[];
}
