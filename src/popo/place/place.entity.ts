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

  @Column({ nullable: true })
  staff_email: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ default: 24 * 60 })
  max_minutes: number;

  @Column({ default: 1 })
  max_concurrent_reservation: number;

  @Column('text', { nullable: false, default: '{"Everyday":"00:00-24:00"}' })
  opening_hours: string;
  // if null, there's no rule for opening hours.
  // checking opening hours is implemented on the frontend side.

  @Column({ default: PlaceEnableAutoAccept.inactive })
  enable_auto_accept: PlaceEnableAutoAccept;

  @Column({ default: 0 })
  total_reservation_count: number;

  /**
   * Database Relation
   */

  @OneToMany(() => ReservePlace, (place_reservation) => place_reservation.place)
  place_reservation: ReservePlace[];
}
