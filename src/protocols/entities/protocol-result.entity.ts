import { Protocol } from './protocol.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ulid } from "ulid";
import { Party } from 'src/parties/entities/party.entity';

@Entity('protocol_results')
export class ProtocolResult {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @ManyToOne(() => Protocol, protocol => protocol.actions)
  @JoinColumn({
    name: 'protocol_id',
  })
  protocol: Protocol;

  @ManyToOne(() => Party)
  @JoinColumn({
    name: 'party_id',
  })
  party: Party;

  @Column()
  validVotesCount: number;

  @Column()
  invalidVotesCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
