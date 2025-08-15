import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../common/base.entity';

@Entity()
export class Whitebook extends Base {
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
}
