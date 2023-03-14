import { Protocol, ProtocolStatus } from './protocol.entity'

export interface ProtocolException {
  getProtocol(): Protocol
  getMessage(): string
}

export class ProtocolStatusException
  extends Error
  implements ProtocolException
{
  private protocol: Protocol

  constructor(
    protocol: Protocol,
    targetStatus: ProtocolStatus,
    message?: string,
  ) {
    const originalStatus = protocol.status || 'empty'
    super(
      message ||
        `protocol_cannot_change_status_from_${originalStatus}_to_${targetStatus}`.toUpperCase(),
    )
    this.protocol = protocol
  }

  getProtocol(): Protocol {
    return this.protocol
  }

  getMessage(): string {
    return this.message
  }
}

export class ProtocolStatusConflictException
  extends Error
  implements ProtocolException
{
  private protocol: Protocol

  constructor(protocol: Protocol, message?: string) {
    super(message || 'PROTOCOL_CONFLICT_IN_STATUS')
    this.protocol = protocol
  }

  getProtocol(): Protocol {
    return this.protocol
  }

  getMessage(): string {
    return this.message
  }
}

export class ProtocolHasResultsException
  extends Error
  implements ProtocolException
{
  private protocol: Protocol

  constructor(protocol: Protocol) {
    super('PROTOCOL_ALREADY_HAS_RESULTS')
    this.protocol = protocol
  }

  getProtocol(): Protocol {
    return this.protocol
  }

  getMessage(): string {
    return this.message
  }
}
