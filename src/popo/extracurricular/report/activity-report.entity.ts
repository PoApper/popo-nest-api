import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';
import { Activity } from '../activity/activity.entity';

@Entity()
export class ActivityReport extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  activityId: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  period: string;

  @Column({ nullable: false })
  grade: string;

  @Column({ nullable: false })
  major: string;

  @Column({ nullable: false })
  author: string;

  @Column('text', { nullable: false })
  wordsToJuniors: string;

  @Column('text', { nullable: false })
  aiSummary: string;

  @Column({ nullable: false })
  fileName: string;

  @Column({ type: 'varchar', default: 'pdf' })
  fileType: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column('json', { nullable: true })
  pages: string[];
}
