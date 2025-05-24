import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserStatus, UserType } from './user.meta';
import { ReserveEquip } from '../reservation/equip/reserve.equip.entity';
import { ReservePlace } from '../reservation/place/reserve.place.entity';
import { Nickname } from './nickname.entity';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  cryptoSalt: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, default: UserType.student })
  userType: UserType;

  @Column({ nullable: false, default: UserStatus.deactivated })
  userStatus: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  lastLoginAt: Date;

  /**
   * Database Relation
   */

  @OneToMany(
    () => ReserveEquip,
    (equip_reservation) => equip_reservation.booker,
  )
  equip_reservation: ReserveEquip[];

  @OneToMany(
    () => ReservePlace,
    (place_reservation) => place_reservation.booker,
  )
  place_reservation: ReservePlace[];

  @OneToOne(() => Nickname, (nickname) => nickname.user)
  nickname: Nickname;
}
