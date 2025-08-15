import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class Affiliate extends Base {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  content_short: string;

  @Column('text', { nullable: false })
  content: string;
}
