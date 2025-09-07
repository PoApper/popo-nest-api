import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class Affiliate extends Base {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column('text', { name: 'content_short', nullable: true })
  contentShort: string;

  @Column('text', { nullable: false })
  content: string;
}
