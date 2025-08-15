import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Base } from '../../common/base.entity';

@Entity()
export class Calendar extends Base {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  event_date: string; // YYYY-MM-DD
}
