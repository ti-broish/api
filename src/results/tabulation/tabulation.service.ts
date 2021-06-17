import { Inject } from '@nestjs/common';
import { Protocol } from 'src/protocols/entities/protocol.entity';
import { ProtocolsRepository } from 'src/protocols/entities/protocols.repository';
import {
  CityRegion,
  Country,
  ElectionRegion,
  Municipality,
  Section,
} from 'src/sections/entities';

// function uniquePredicate(value: any, index: number, self: any[]) {
//   return self.indexOf(value) === index;
// }

export class TabulationService {
  constructor(
    @Inject(ProtocolsRepository)
    private readonly protocolsRepo: ProtocolsRepository,
  ) {}

  async tabulate(): Promise<void> {
    const approvedProtocols = await this.getApprovedProtocols();
    const sections = approvedProtocols.map(
      (protocol: Protocol) => protocol.section,
    );
    /* TODO ?!? */
    // const electionRegionIds = sections
    //   .map((section: Section) => section.id.substr(0, 2))
    //   .filter(uniquePredicate);
    // const publishedProtocols = await this.protocolsRepo.findPublishedProtocolsFrom(
    //   electionRegionIds,
    // );
    /* TODO ?!? */
    const countries: Country[] = [],
      electionRegions: ElectionRegion[] = [],
      municipalities: Municipality[] = [],
      cityRegions: CityRegion[] = [];

    sections.forEach((section: Section) => {
      electionRegions.push(section.electionRegion);
      cityRegions.push(section.cityRegion);
      const town = section.town;
      countries.push(town.country);
      municipalities.push(town.municipality);
    });

    // findPublishedProtocolsFrom
  }

  private async getApprovedProtocols(): Promise<Protocol[]> {
    const protocols = await this.protocolsRepo.findApprovedProtocols();
    this.protocolsRepo.markProtocolsAsPublishing(protocols);
    return protocols;
  }
}
