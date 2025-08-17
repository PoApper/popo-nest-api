import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ClubType } from './intro.club.meta';
import { Base } from '../../../common/base.entity';

// TODO: Prod DB 안정화 후 엔티티들 camelCase로 변경

@Entity()
export class IntroClub extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column({ name: 'short_desc', nullable: false })
  short_desc: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: false })
  location: string; // 위치

  @Column({ nullable: false })
  representative: string; // 대표자

  @Column({ nullable: false })
  contact: string;

  @Column({ name: 'club_type', nullable: false })
  club_type: ClubType;

  @Column({ name: 'image_url', nullable: true })
  image_url: string;

  @Column({ default: 0 })
  views: number;

  @Column({ name: 'homepage_url', nullable: true })
  homepage_url: string;

  @Column({ name: 'facebook_url', nullable: true })
  facebook_url: string;

  @Column({ name: 'instagram_url', nullable: true })
  instagram_url: string;

  @Column({ name: 'youtube_url', nullable: true })
  youtube_url: string;
}
