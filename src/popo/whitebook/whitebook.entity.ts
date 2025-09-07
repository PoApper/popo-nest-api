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

  @Column({ name: 'click_count', default: 0 })
  clickCount: number;

  @Column({ name: 'show_only_login', default: false })
  showOnlyLogin: boolean;
}
