import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Section } from 'src/sections/entities';
import { mapToType, NodeType } from './results.controller';

export class CrumbMaker {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  makeCrumbs(items: any[]) {
    return items
      .filter((x) => !!x)
      .reduce(
        (crumbs: Record<string, string>[], item) => {
          crumbs.push({
            segment:
              item instanceof Section
                ? item.id
                : crumbs.reduce((acc, x) => `${acc}${x.segment}`, '') +
                  item.code,
            name: item.name,
            type: mapToType(item),
          });
          return crumbs;
        },
        [
          {
            segment: '',
            name: this.config.get('ELECTION_CAMPAIGN_NAME'),
            type: NodeType.ELECTION,
          },
        ],
      );
  }
}
