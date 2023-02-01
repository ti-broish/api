import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('parties', {
  orderBy: {
    id: 'ASC',
  },
})
export class Party {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  displayName: string

  @Column()
  isFeatured: boolean

  @Column()
  color: string
}
