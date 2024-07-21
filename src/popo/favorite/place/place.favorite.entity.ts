import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class FavoritePlace extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  user_id: string;

  @Column({ nullable: false })
  place_id: string;

  @CreateDateColumn()
  created_at: Date;
}
