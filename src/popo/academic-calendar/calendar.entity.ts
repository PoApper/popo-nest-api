import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../common/base.entity';

@Entity()
export class Calendar extends Base {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ name: 'event_date', nullable: false })
  eventDate: string; // YYYY-MM-DD
}
