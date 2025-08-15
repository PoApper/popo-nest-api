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

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: false })
  start_datetime: string; // YYYY-MM-DD HH:mm:ss (KST)

  @Column({ nullable: false })
  end_datetime: string; // YYYY-MM-DD HH:mm:ss (KST)

  @Column({ default: 0 })
  click_count: number;
}
