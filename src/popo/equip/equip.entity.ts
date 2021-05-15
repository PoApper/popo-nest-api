import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity, PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity()
export class Equip extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({nullable: false})
  name: string;

  @Column()
  description: string;

  @Column({nullable: false})
  fee: number;

  @Column({nullable: false})
  equipOwner: string;

  @Column({nullable: true})
  equipStaff: string;

  @Column({nullable: true})
  imageName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}