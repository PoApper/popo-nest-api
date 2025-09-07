import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from '../../../common/base.entity';

@Entity()
export class FavoritePlace extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'user_id', nullable: false })
  userId: string;

  @Column({ name: 'place_id', nullable: false })
  placeId: string;
}
