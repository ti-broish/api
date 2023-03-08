import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  CityRegion,
  Country,
  ElectionRegion,
  Municipality,
  Section,
} from 'src/sections/entities'
import { MUNICIPALITIES_HIDDEN } from 'src/sections/sections.constants'
import { mapToType, NodeType } from './results.controller'

export interface Crumb {
  segment: string
  name: string
  type: NodeType
}

export class CrumbMaker {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  makeCrumbs(
    items: (ElectionRegion | Municipality | Country | CityRegion | Section)[],
  ) {
    const segments: string[] = []
    return items
      .filter((x) => !!x)
      .reduce(
        (crumbs: Crumb[], item): Crumb[] => {
          segments.push(item.code)
          if (
            item instanceof Municipality &&
            MUNICIPALITIES_HIDDEN.includes(segments.join(''))
          ) {
            return crumbs
          }

          crumbs.push({
            segment: item instanceof Section ? item.id : segments.join(''),
            name: item instanceof Section ? item.code : item.name,
            type: mapToType(item),
          } as Crumb)
          return crumbs
        },
        [
          {
            segment: '',
            name: this.config.get<string>('ELECTION_CAMPAIGN_NAME'),
            type: NodeType.ELECTION,
          } as Crumb,
        ],
      )
  }
}
