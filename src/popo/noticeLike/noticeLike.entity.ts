import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Base } from '../../common/base.entity';

@Entity()
@Index(['userId', 'noticeId'], { unique: true })
export class NoticeLike extends Base {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id', nullable: false })
  userId: string;

  @Column({ name: 'notice_id', nullable: false })
  noticeId: number;
}
