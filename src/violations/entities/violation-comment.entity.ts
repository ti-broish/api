import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'
import { ulid } from 'ulid'
import { User } from '../../users/entities'
import { Violation } from './violation.entity'

@Entity('violation_comments', {
  orderBy: { createdAt: 'DESC' },
})
export class ViolationComment {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid()

  @Column({ type: 'text' })
  text: string

  @ManyToOne(() => Violation, (violation) => violation.comments)
  @JoinColumn({
    name: 'violation_id',
  })
  violation: Violation

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'author_id',
  })
  author: User

  @CreateDateColumn()
  createdAt: Date
}
