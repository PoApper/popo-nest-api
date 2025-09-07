import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../common/base.entity';

@Entity()
export class Notice extends Base {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  link: string;

  @Column({ name: 'start_datetime', nullable: false })
  startDatetime: string; // YYYY-MM-DD HH:mm:ss (KST)

  @Column({ name: 'end_datetime', nullable: false })
  endDatetime: string; // YYYY-MM-DD HH:mm:ss (KST)

  @Column({ name: 'click_count', default: 0 })
  clickCount: number;
}
