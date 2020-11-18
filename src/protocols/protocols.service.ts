import { Injectable } from '@nestjs/common';

@Injectable()
export class ProtocolsService {
  getProtocol(): string {
    return 'Protocols World!';
  }
}
