import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity, OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn, Unique,
} from "typeorm";
import {UserStatus, UserType} from "./user.meta";
import {Place} from "../place/place.entity";

@Entity()
@Unique(['email', 'id'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({nullable: false})
  email: string;

  @Column({nullable: false})
  id: string;

  @Column({nullable: false})
  password: string;

  @Column({nullable: false})
  cryptoSalt: string;

  @Column({nullable: false})
  name: string;

  @Column({nullable: false})
  userType: UserType;

  @Column({nullable: false, default: UserStatus.deactivated})
  userStatus: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  lastLoginAt: Date;

  /**
   * Database Relationship
   */

  @OneToMany(() => Place, place => place.placeStaff)
  places: Place[];
}