import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class FavoritePlace extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  user_id: string;

  @Column({ nullable: false })
  place_id: string;
}
