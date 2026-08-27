import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class IntroStudentAssociation extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @PrimaryColumn({ nullable: false })
  name: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ name: 'short_desc', nullable: false })
  shortDesc: string;

  @Column({ nullable: true })
  location: string; // 위치

  @Column({ nullable: false })
  representative: string; // 대표자

  @Column({ nullable: true })
  office: string; // 협업 행정팀 이름

  @Column({ nullable: false })
  contact: string;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  views: number;

  @Column('text', { name: 'homepage_url', nullable: true })
  homepageUrl: string;

  @Column('text', { name: 'facebook_url', nullable: true })
  facebookUrl: string;

  @Column('text', { name: 'instagram_url', nullable: true })
  instagramUrl: string;

  @Column('text', { name: 'youtube_url', nullable: true })
  youtubeUrl: string;
}
