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

  @Column({ name: 'open_hour', nullable: true })
  openHour: string;

  @Column({ nullable: true })
  phone: string;

  @Column('text', { nullable: false })
  content: string;
}
