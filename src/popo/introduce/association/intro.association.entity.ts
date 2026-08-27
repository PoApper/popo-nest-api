import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';
import { AssociationType } from './intro.association.meta';

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

  @Column({
    name: 'association_type',
    nullable: false,
    default: AssociationType.others,
  })
  associationType: AssociationType = AssociationType.others;

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
}
