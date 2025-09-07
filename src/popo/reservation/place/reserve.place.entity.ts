import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReservationStatus } from '../reservation.meta';
import { User } from '../../user/user.entity';
import { Place } from '../../place/place.entity';
import { Base } from '../../../common/base.entity';

@Entity()
export class ReservePlace extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'place_id', nullable: true })
  placeId: string; // uuid of place

  @Column({ name: 'booker_id', nullable: true })
  bookerId: string; // uuid of booker

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

  @ManyToOne(() => Place, (place) => place.placeReservation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @ManyToOne(() => User, (user) => user.placeReservation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booker_id' })
  booker: User;
}
