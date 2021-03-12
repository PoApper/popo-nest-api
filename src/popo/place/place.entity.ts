import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";
import {PlaceRegion} from "./place.meta";
import {User} from "../user/user.entity";

@Entity()
export class Place extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @PrimaryColumn({nullable: false})
  name: string;

  @Column({nullable: true})
  description: string;

  @Column({nullable: true})
  location: string;

  @Column({nullable: false})
  region: PlaceRegion; // 학생회관 / 지곡 / OTHERS

  @Column({nullable: false})
  placeOwner: string;

  @ManyToOne(() => User, user => user.places)
  placeStaff: User;

  @Column({nullable: true})
  imageName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}