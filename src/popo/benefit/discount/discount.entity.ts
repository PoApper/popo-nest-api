import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Discount extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  open_hour: string;

  @Column({ nullable: true })
  phone: string;

  @Column('text', { nullable: false })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
