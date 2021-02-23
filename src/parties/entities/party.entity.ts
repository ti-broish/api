import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('parties')
export class Party {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: number;

  @Column()
  name: string;

  @Column()
  displayName: string;

  @Column()
  isFeatured: boolean;

  @Column()
  color: string;
}
