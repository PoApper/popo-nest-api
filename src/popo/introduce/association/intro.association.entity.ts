import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class IntroAssociation extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @PrimaryColumn({ nullable: false })
  name: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: false })
  location: string; // 위치

  @Column({ nullable: false })
  representative: string; // 대표자

  @Column({ nullable: false })
  contact: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ default: 0 })
  views: number;

  @Column({ nullable: true })
  homepage_url: string;

  @Column({ nullable: true })
  facebook_url: string;

  @Column({ nullable: true })
  instagram_url: string;
}
