import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class IntroAssociationCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // Executive, Autonomous, Media, Specialized

  @Column()
  displayName: string; // 집행기구, 자치기구, 언론기구, 전문기구 

  @OneToMany(() => IntroAssociation, (association) => association.category)
  associations: IntroAssociation[];
}

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

  // 카테고리 관계 추가 (FK)
  @ManyToOne(() => IntroAssociationCategory, (category) => category.associations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: IntroAssociationCategory;

  @Column({ name: 'category_id' })
  categoryId: number;
}