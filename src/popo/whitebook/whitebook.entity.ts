import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Whitebook extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  link: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ default: 0 })
  click_count: number;

  @Column({ default: false })
  show_only_login: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
