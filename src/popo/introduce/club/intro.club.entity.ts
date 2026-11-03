import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ClubType } from './intro.club.meta';
import { Base } from '../../../common/base.entity';

@Entity()
export class IntroClub extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column({ name: 'name_en', type: 'varchar', length: 255, nullable: true })
  nameEn?: string | null;

  @Column({ name: 'short_desc', nullable: false })
  shortDesc: string;

  @Column({
    name: 'short_desc_en',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  shortDescEn?: string | null;

  @Column('text', { nullable: true })
  content: string;

  @Column({ name: 'content_en', type: 'text', nullable: true })
  contentEn?: string | null;

  @Column({ nullable: false })
  location: string; // 위치

  @Column({ name: 'location_en', type: 'varchar', length: 255, nullable: true })
  locationEn?: string | null;

  @Column({ nullable: false })
  representative: string; // 대표자

  @Column({
    name: 'representative_en',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  representativeEn?: string | null;

  @Column({ nullable: false })
  contact: string;

  @Column({ name: 'contact_en', type: 'varchar', length: 255, nullable: true })
  contactEn?: string | null;

  @Column({ name: 'club_type', nullable: false })
  clubType: ClubType;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  views: number;

  @Column({ name: 'homepage_url', nullable: true })
  homepageUrl: string;

  @Column({ name: 'facebook_url', nullable: true })
  facebookUrl: string;

  @Column({ name: 'instagram_url', nullable: true })
  instagramUrl: string;

  @Column({ name: 'youtube_url', nullable: true })
  youtubeUrl: string;
}
