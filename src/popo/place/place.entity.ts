import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlaceRegion } from './place.meta';
import { ReservePlace } from '../reservation/place/reserve.place.entity';

@Entity()
export class Place extends BaseEntity {
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
  imageName: string;

  @Column({ default: null })
  max_minutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  /**
   * Database Relation
   */

  @OneToMany(() => ReservePlace, (place_reservation) => place_reservation.place)
  place_reservation: ReservePlace[];
}
