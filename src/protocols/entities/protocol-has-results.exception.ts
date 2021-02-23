import { Protocol } from "./protocol.entity";

export class ProtocolHasResultsException extends Error {
  private protocolId: string;

  constructor(protocol: Protocol, message?: string) {
    super(message || 'Protocol already has its results populated!');
    this.protocolId = protocol.id;
  }

  getProtocolId(): string {
    return this.protocolId;
  }
}
