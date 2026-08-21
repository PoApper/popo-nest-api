import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
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

  // 관리자용 자유 메모. 학생 화면에도 함께 노출된다.
  @Column('text', { nullable: true })
  memo: string;

  // 업로드된 원본 파일명 (확장자 포함)
  @Column({ nullable: false })
  fileName: string;

  // 확장자 소문자. 파일명에서 유도한다.
  @Column({ type: 'varchar', default: 'pdf' })
  fileType: string;

  // S3 object key 또는 로컬 저장 경로. 파일 스트리밍에 사용한다.
  @Column({ nullable: true })
  fileKey: string;

  // S3/CDN URL. 로컬에서는 local://key 형태다.
  @Column({ nullable: true })
  fileUrl: string;
}
