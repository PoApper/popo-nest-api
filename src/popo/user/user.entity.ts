import {
  Column,
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
import { FcmKey } from 'src/fcm/entities/fcm-key.entity';
import { ApiHideProperty } from '@nestjs/swagger';
import { Base } from '../../common/base.entity';

@Entity()
@Unique(['email'])
export class User extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ name: 'crypto_salt', nullable: false })
  cryptoSalt: string;

  @Column({ nullable: false })
  name: string;

  @Column({ name: 'user_type', nullable: false, default: UserType.student })
  userType: UserType;

  @Column({
    name: 'user_status',
    nullable: false,
    default: UserStatus.deactivated,
  })
  userStatus: UserStatus;

  @Column({ name: 'hashed_refresh_token', nullable: true })
  hashedRefreshToken: string;

  @Column({ name: 'refresh_token_expires_at', nullable: true })
  refreshTokenExpiresAt: Date;

  @Column({ name: 'last_login_at' })
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

  @OneToMany(() => FcmKey, (fcm_key) => fcm_key.user)
  @ApiHideProperty()
  push_keys: FcmKey[];

  @OneToOne(() => Nickname, (nickname) => nickname.user)
  nickname: Nickname;
}
