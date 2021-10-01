import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlaceRegion } from './place.meta';

@Entity()
export class Place extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @PrimaryColumn({ nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: false })
  region: PlaceRegion; // 학생회관 / 지곡 / OTHERS

  @Column({ nullable: true })
  staff_email: string;

  @Column({ nullable: true })
  imageName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
