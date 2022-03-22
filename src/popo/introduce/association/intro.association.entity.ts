import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class IntroAssociation extends BaseEntity {
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
  logoName: string;

  // 이미지 슬라이드 구현하면 사용할 Column
  // @Column('simple-array', {nullable: true})
  // contentImageNames: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}

@Entity()
export class Association {
  @PrimaryColumn({ nullable: false })
  id: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  representative_contact: string;

  @Column({ nullable: true })
  homepage_url: string;

  @Column({ nullable: true })
  official_sns: string;

  @Column({ nullable: true })
  file_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Database Relationship
   * */

  @OneToMany(
    () => AssociationDescription,
    (associationDescription) => associationDescription.association,
  )
  description: AssociationDescription[];
}

@Entity()
export class AssociationDescription {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  representative: string;

  @Column({ nullable: false })
  language: string;

  @Column({ nullable: false })
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Database Relationship
   * */

  @ManyToOne(() => Association, (association) => association.description)
  @JoinColumn({ name: 'id' })
  association: Association;
}
