import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ClubType } from './intro.club.meta';
import { Base } from '../../../common/base.entity';

@Entity()
export class IntroClub extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  short_desc: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: false })
  location: string; // 위치

  @Column({ nullable: false })
  representative: string; // 대표자

  @Column({ nullable: false })
  contact: string;

  @Column({ nullable: false })
  clubType: ClubType;

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

  @Column({ nullable: true })
  youtube_url: string;
}
