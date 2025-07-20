import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  PLACE_RESERVATION = 'place_reservation',
  EQUIP_RESERVATION = 'equip_reservation',
}

@Entity()
export class NotificationRecord extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  reservationId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    nullable: false,
  })
  type: NotificationType;

  @Column({ nullable: false, default: true })
  sent: boolean;

  @CreateDateColumn()
  sentAt: Date;
}
