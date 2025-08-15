import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class Discount extends Base {
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
}
