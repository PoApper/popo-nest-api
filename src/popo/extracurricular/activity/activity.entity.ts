import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class Activity extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  period: string;

  @Column({ nullable: false })
  target: string;

  @Column('text', { nullable: false })
  applicationMethod: string;

  @Column('text', { nullable: false })
  description: string;

  @Column({ nullable: false })
  category: string;

  @Column({ default: 'BookOpen' })
  iconName: string;
}
