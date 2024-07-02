import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Notice extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: false })
  start_datetime: string; // YYYY-MM-DD HH:mm:ss (KST)

  @Column({ nullable: false })
  end_datetime: string; // YYYY-MM-DD HH:mm:ss (KST)

  @Column({ default: 0 })
  click_count: number;

  @Column({ default: 0 })
  like_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
