import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Municipality, Section } from 'src/sections/entities'
import { mapToType, NodeType } from './results.controller'

export class CrumbMaker {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  makeCrumbs(items: any[]) {
    const segments = []
    return items
      .filter((x) => !!x)
      .reduce(
        (crumbs: Record<string, string>[], item) => {
          segments.push(item.code)
          if (item instanceof Municipality && item.isMunicipalityHidden()) {
            return crumbs
          }

          crumbs.push({
            segment:
              item instanceof Section
                ? item.id
                : segments.reduce((acc, x) => `${acc}${x}`, ''),
            name: item.name,
            type: mapToType(item),
          })
          return crumbs
        },
        [
          {
            segment: '',
            name: this.config.get('ELECTION_CAMPAIGN_NAME'),
            type: NodeType.ELECTION,
          },
        ],
      )
  }
}
