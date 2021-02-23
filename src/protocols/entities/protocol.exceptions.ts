import { Protocol, ProtocolStatus } from './protocol.entity';

export interface ProtocolException {
  getProtocol(): Protocol;

  getMessage(): string;

  getType(): string;
}

export class ProtocolStatusException extends Error implements ProtocolException {
  private protocol: Protocol;

  constructor(protocol: Protocol, targetStatus: ProtocolStatus, message?: string) {
    const originalStatus = protocol.status || 'empty';
    super(message || `Protocol ${protocol.id} status cannot be changed from ${originalStatus} to ${targetStatus}`);
    this.protocol = protocol;
    this.name = 'ProtocolStatusException';
  }

  getProtocol(): Protocol|null {
    return this.protocol || null;
  }

  getMessage(): string {
    return this.message;
  }

  getType(): string {
    return this.name;
  }
}

export class ProtocolHasResultsException extends Error implements ProtocolException {
  private protocol: Protocol;

  constructor(protocol: Protocol, message?: string, ) {
    super(message || `Protocol ${protocol.id} already has its results populated!`);
    this.protocol = protocol;
    this.name = 'ProtocolHasResultsException';
  }

  getProtocol(): Protocol|null {
    return this.protocol || null;
  }

  getMessage(): string {
    return this.message;
  }

  getType(): string {
    return this.name;
  }
}
