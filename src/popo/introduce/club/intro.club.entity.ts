import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ClubType } from './intro.club.meta';
import { Base } from '../../../common/base.entity';

@Entity()
export class IntroClub extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, name: 'short_desc' })
  shortDesc: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: false })
  location: string; // 위치

  @Column({ nullable: false })
  representative: string; // 대표자

  @Column({ nullable: false })
  contact: string;

  @Column({ nullable: false, name: 'club_type' })
  clubType: ClubType;

  @Column({ nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ default: 0 })
  views: number;

  @Column({ nullable: true, name: 'homepage_url' })
  homepageUrl: string;

  @Column({ nullable: true, name: 'facebook_url' })
  facebookUrl: string;

  @Column({ nullable: true, name: 'instagram_url' })
  instagramUrl: string;

  @Column({ nullable: true, name: 'youtube_url' })
  youtubeUrl: string;
}
