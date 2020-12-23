import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';
import { Protocol } from './protocol.entity';

@Entity('protocol_data')
export class ProtocolData {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @OneToOne(() => Protocol, protocol => protocol.data)
  @JoinColumn({
    name: 'protocol_id',
  })
  protocol: Protocol;

  @Column()
  validVotesCount: number;

  @Column()
  invalidVotesCount: number;

  @Column()
  machineVotesCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
