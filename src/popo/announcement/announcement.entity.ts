import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Announcement extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  memo: string;
  
  @Column({ nullable: true })
  image_url: string;
  
  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  start_datetime: string; // YYYY-MM-DD HH:mm:ss (KST)
  
  @Column({ nullable: true })
  end_datetime: string; // YYYY-MM-DD HH:mm:ss (KST)
  
  @Column({ default: 0})
  click_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
