import {
  Controller,
  Get,
  HttpCode,
  Param,
  ValidationPipe,
  UsePipes,
  NotFoundException,
  Header,
  Inject,
} from '@nestjs/common'
import { Public } from 'src/auth/decorators'
import {
  CityRegion,
  Country,
  ElectionRegion,
  Municipality,
  Section,
  Town,
} from 'src/sections/entities'
import { ElectionRegionsRepository } from 'src/sections/entities/electionRegions.repository'
import { MunicipalitiesRepository } from 'src/sections/entities/municipalities.repository'
import { PartiesRepository } from 'src/parties/entities/parties.repository'
import { CountriesRepository } from 'src/sections/entities/countries.repository'
import { SectionsRepository } from 'src/sections/entities/sections.repository'
import { StatsDto } from './stats.dto'
import { ConfigService } from '@nestjs/config'
import { CrumbMaker } from './crumb-maker.service'
import { ProtocolsRepository } from 'src/protocols/entities/protocols.repository'
import { Protocol } from 'src/protocols/entities/protocol.entity'
import { ProtocolDto } from 'src/protocols/api/protocol.dto'
import { PicturesUrlGenerator } from 'src/pictures/pictures-url-generator.service'
import { PictureDto } from 'src/pictures/api/picture.dto'
import {
  MUNICIPALITIES_HIDDEN,
  MUNICIPALITIES_MULTI_REGION,
} from 'src/sections/sections.constants'
import { TownsRepository } from 'src/sections/entities/towns.repository'
import { WithCode } from 'src/sections/entities/withCode.interface'
import { SECTION_SEGMENT_BREAKDOWN } from 'src/sections/sections-pattern'

export enum NodeType {
  ELECTION = 'election',
  ELECTION_REGION = 'electionRegion',
  COUNTRY = 'country',
  MUNICIPALITY = 'municipality',
  TOWN = 'town',
  DISTRICT = 'district',
  ADDRESS = 'address',
  SECTION = 'section',
}

export enum NodesType {
  ELECTION_REGIONS = 'electionRegions',
  COUNTRIES = 'countries',
  MUNICIPALITIES = 'municipalities',
  TOWNS = 'towns',
  DISTRICTS = 'districts',
  ADDRESSES = 'addresses',
  SECTIONS = 'sections',
}

export const mapToType = (
  item:
    | ElectionRegion
    | Country
    | Municipality
    | Town
    | CityRegion
    | Section
    | string,
): NodeType => {
  if (item instanceof ElectionRegion) {
    return NodeType.ELECTION_REGION
  }
  if (item instanceof Country) {
    return NodeType.COUNTRY
  }
  if (item instanceof Municipality) {
    return NodeType.MUNICIPALITY
  }
  if (item instanceof Town) {
    return NodeType.TOWN
  }
  if (item instanceof CityRegion) {
    return NodeType.DISTRICT
  }
  if (item instanceof Section) {
    return NodeType.SECTION
  }

  if (typeof item === 'string') {
    return NodeType.ADDRESS
  }

  throw new Error('Unexpected node type')
}

const townsToCityRegionsReducer = (
  acc: Record<string, CityRegion>,
  town: Town,
) => {
  town.cityRegions.forEach((cityRegion: CityRegion) => {
    if (!acc[cityRegion.code]) {
      acc[cityRegion.code] = cityRegion
    }
    if (!acc[cityRegion.code].towns) {
      acc[cityRegion.code].towns = []
    }
    acc[cityRegion.code].towns.push(town)
  })
  delete town.cityRegions
  return acc
}

const groupByPlaceReducer = (
  acc: Record<string, Section[]>,
  section: Section,
) => {
  ;(acc[section.place] = acc[section.place] || []).push(section)
  return acc
}

const sectionMapper = ({ code, id, stats, results, riskLevel }: Section) => ({
  id: code,
  segment: id,
  name: `Секция ${code}`,
  type: NodeType.SECTION,
  stats,
  results,
  riskLevel: riskLevel,
})

const mapSections = ([place, sections]: [string, Section[]]) => ({
  name: place,
  type: mapToType(place),
  nodesType: NodesType.SECTIONS,
  nodes: sections.map(sectionMapper),
})

const groupSectionsByPlaceReducer = (sections: Section[]) =>
  Object.entries(sections.reduce(groupByPlaceReducer, {})).map(mapSections)

const makeSegment = (items: WithCode[]): string =>
  items.map(({ code }): string => code).join('')

@Controller('results')
@Public()
export class ResultsController {
  constructor(
    private readonly crumbMaker: CrumbMaker,
    private readonly config: ConfigService,
    private readonly electionRegionsRepo: ElectionRegionsRepository,
    private readonly partiesRepo: PartiesRepository,
    private readonly municipalitiesRepo: MunicipalitiesRepository,
    private readonly countriesRepo: CountriesRepository,
    private readonly townsRepo: TownsRepository,
    private readonly sectionsRepo: SectionsRepository,
    private readonly protocolsRepo: ProtocolsRepository,
    @Inject(PicturesUrlGenerator)
    private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Get('meta.json')
  @HttpCode(200)
  @Header('Cache-Control', 'max-age: 60')
  @UsePipes(new ValidationPipe({ transform: true }))
  async meta(): Promise<Record<string, any>> {
    return {
      name: this.config.get('ELECTION_CAMPAIGN_NAME'),
      endOfElectionDayTimestamp: this.config.get('STREAMING_TIMESTAMP'),
      parties: (await this.partiesRepo.findAllForResults()).map(
        ({ id, name, displayName, color }) => ({
          id,
          name: name.replace(/\d+\.\s+(.*)/, '$1'),
          displayName: displayName.replace(/\d+\.\s+(.*)/, '$1'),
          color,
        }),
      ),
    }
  }

  @Get('index.json')
  @HttpCode(200)
  @Header('Cache-Control', 'max-age: 60')
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(): Promise<Record<string, any>> {
    const stats = await this.sectionsRepo.getStatsFor()
    const statsPerElectionRegion = await this.sectionsRepo.getStatsFor('', 2)
    const electionRegionResults = await this.sectionsRepo.getResultsFor('', 2)

    return {
      id: null,
      segment: '',
      name: this.config.get<string>('ELECTION_CAMPAIGN_NAME'),
      type: NodeType.ELECTION,
      results: (await this.sectionsRepo.getResultsFor()) || [],
      stats,
      crumbs: [],
      abroad: false,
      nodesType: NodesType.ELECTION_REGIONS,
      nodes: (await this.electionRegionsRepo.findAllWithStats()).map(
        (electionRegion) => ({
          id: electionRegion.code,
          segment: makeSegment([electionRegion]),
          name: electionRegion.name,
          type: mapToType(electionRegion),
          results: electionRegionResults[electionRegion.code] || [],
          stats: statsPerElectionRegion[electionRegion.code] || {},
        }),
      ),
    }
  }

  @Get(':segment.json')
  @HttpCode(200)
  @Header('Cache-Control', 'max-age: 60')
  @UsePipes(new ValidationPipe({ transform: true, disableErrorMessages: true }))
  async subset(
    @Param('segment') segment: string,
  ): Promise<Record<string, any>> {
    const matches = SECTION_SEGMENT_BREAKDOWN.exec(segment)
    if (matches === null) {
      throw new NotFoundException()
    }

    const {
      municipalityCode,
      cityRegionCode,
      abroadRegionCode,
      countryCode,
      sectionCodeAbroad,
      sectionCodeDomestic,
    } = matches.groups

    const section = await this.sectionsRepo.findOneByPartialIdOrFail(segment)

    const electionRegion = section.electionRegion

    if (abroadRegionCode) {
      return this.getAbroadResults(section, countryCode, sectionCodeAbroad)
    }

    if (!municipalityCode) {
      return this.getDomesticElectionRegionResults(electionRegion)
    }

    const municipality = section.town.municipality

    if (!cityRegionCode) {
      return this.getMunicipalityResults(electionRegion, municipality)
    }

    const cityRegion = section.cityRegion

    if (!sectionCodeDomestic) {
      return this.getCityRegionResults(electionRegion, municipality, cityRegion)
    }

    return this.getSectionResults(
      electionRegion,
      municipality,
      cityRegion,
      section,
    )
  }

  private async getAbroadResults(
    section: Section,
    countryCode: string | null,
    sectionCodeAbroad: string | null,
  ): Promise<Record<string, any>> {
    const electionRegion = section.electionRegion
    if (!countryCode) {
      return this.getAbroadElectionRegionResults(electionRegion)
    }
    const country = section.town.country
    if (!sectionCodeAbroad) {
      return this.getCountryResults(electionRegion, country)
    }

    return this.getSectionResults(electionRegion, country, null, section)
  }

  private async getDomesticElectionRegionResults(
    electionRegion: ElectionRegion,
  ): Promise<Record<string, any>> {
    let nodesType: NodesType, nodes: any[]
    nodesType = NodesType.MUNICIPALITIES
    const municipalities =
      await this.municipalitiesRepo.findFromElectionRegionWithCityRegionsAndStats(
        electionRegion.id,
      )
    if (municipalities.length === 1) {
      const districtStats = await this.sectionsRepo.getStatsFor(
        makeSegment([electionRegion, municipalities[0]]),
        6,
      )
      const districtResults = await this.sectionsRepo.getResultsFor(
        makeSegment([electionRegion, municipalities[0]]),
        6,
      )
      if (
        MUNICIPALITIES_MULTI_REGION.includes(
          `${electionRegion.code}${municipalities[0].code}`,
        )
      ) {
        nodesType = NodesType.DISTRICTS
        const districts = municipalities[0].towns.reduce(
          townsToCityRegionsReducer,
          {},
        )
        nodes = Object.entries(districts).map(([code, district]) => ({
          id: code,
          segment: makeSegment([electionRegion, municipalities[0], district]),
          name: district.name,
          type: mapToType(district),
          results:
            districtResults[
              makeSegment([electionRegion, municipalities[0], district])
            ] || [],
          stats:
            districtStats[
              makeSegment([electionRegion, municipalities[0], district])
            ] || {},
        }))
      } else {
        nodesType = NodesType.TOWNS
        nodes = municipalities[0].towns.map(
          ({ code: id, name, cityRegions }) => ({
            id,
            name,
            type: NodeType.TOWN,
            nodesType: NodesType.DISTRICTS,
            nodes: cityRegions.map(({ name, code: id }) => ({
              id,
              segment: `${electionRegion.code}${municipalities[0].code}${id}`,
              name,
              type: NodeType.DISTRICT,
              results:
                districtResults[
                  `${electionRegion.code}${municipalities[0].code}${id}`
                ] || [],
              stats:
                districtStats[
                  `${electionRegion.code}${municipalities[0].code}${id}`
                ] || {},
            })),
          }),
        )
      }
    } else {
      const municipalityStats = await this.sectionsRepo.getStatsFor(
        electionRegion.code,
        4,
      )
      const municipalityResults = await this.sectionsRepo.getResultsFor(
        electionRegion.code,
        4,
      )
      nodesType = NodesType.MUNICIPALITIES
      nodes = municipalities.map(({ code: id, name }) => ({
        id,
        segment: `${electionRegion.code}${id}`,
        name,
        type: NodeType.MUNICIPALITY,
        results: municipalityResults[`${electionRegion.code}${id}`] || [],
        stats: municipalityStats[`${electionRegion.code}${id}`] || {},
      }))
    }

    return {
      id: electionRegion.code,
      segment: `${electionRegion.code}`,
      name: electionRegion.name,
      type: mapToType(electionRegion),
      results:
        (await this.sectionsRepo.getResultsFor(electionRegion.code)) || [],
      stats: (await this.sectionsRepo.getStatsFor(electionRegion.code)) || {},
      crumbs: this.crumbMaker.makeCrumbs([]),
      abroad: false,
      nodesType,
      nodes,
    }
  }

  private async getAbroadElectionRegionResults(
    electionRegion: ElectionRegion,
  ): Promise<Record<string, any>> {
    const countryStats = await this.sectionsRepo.getStatsFor(
      electionRegion.code,
      5,
    )
    const countryResults = await this.sectionsRepo.getResultsFor(
      electionRegion.code,
      5,
    )

    return {
      id: electionRegion.code,
      segment: `${electionRegion.code}`,
      name: electionRegion.name,
      type: mapToType(electionRegion),
      results:
        (await this.sectionsRepo.getResultsFor(electionRegion.code)) || [],
      stats: (await this.sectionsRepo.getStatsFor(electionRegion.code)) || {},
      crumbs: this.crumbMaker.makeCrumbs([]),
      abroad: true,
      nodesType: NodesType.COUNTRIES,
      nodes: (await this.countriesRepo.findAllAbroadWithStats()).map(
        (country) => {
          const segment = makeSegment([electionRegion, country])
          return {
            id: country.code,
            segment,
            name: country.name,
            type: mapToType(country),
            results: countryResults[segment] || [],
            stats: countryStats[segment] || {},
          }
        },
      ),
    }
  }

  private async getMunicipalityResults(
    electionRegion: ElectionRegion,
    municipality: Municipality,
  ): Promise<Record<string, any>> {
    if (
      MUNICIPALITIES_HIDDEN.includes(
        `${electionRegion.code}${municipality.code}`,
      )
    ) {
      throw new NotFoundException()
    }

    const sectionsStats = await this.sectionsRepo.getStatsFor(
      makeSegment([electionRegion, municipality]),
      9,
    )
    const sectionsResults = await this.sectionsRepo.getResultsFor(
      makeSegment([electionRegion, municipality]),
      9,
    )
    const { code, name } = municipality

    return {
      id: code,
      segment: `${electionRegion.code}${code}`,
      name,
      type: mapToType(municipality),
      results:
        (await this.sectionsRepo.getResultsFor(
          `${electionRegion.code}${code}`,
        )) || [],
      stats: await this.sectionsRepo.getStatsFor(
        `${electionRegion.code}${code}`,
      ),
      crumbs: this.crumbMaker.makeCrumbs([electionRegion]),
      abroad: false,
      nodesType: NodesType.TOWNS,
      nodes: (await this.townsRepo.findByMunicipality(municipality.id)).map(
        ({ code: id, name, sections }) => ({
          id,
          name,
          type: NodeType.TOWN,
          nodesType: NodesType.ADDRESSES,
          nodes: groupSectionsByPlaceReducer(
            sections.map((section) => {
              section.stats = sectionsStats[section.id] || {}
              section.results = sectionsResults[section.id] || []
              return section
            }),
          ),
        }),
      ),
    }
  }

  private async getCountryResults(
    electionRegion: ElectionRegion,
    country: Country,
  ): Promise<Record<string, any>> {
    const sectionsStats = await this.sectionsRepo.getStatsFor(
      makeSegment([electionRegion, country]),
      9,
    )
    const sectionsResults = await this.sectionsRepo.getResultsFor(
      makeSegment([electionRegion, country]),
      9,
    )

    return {
      id: country.code,
      segment: makeSegment([electionRegion, country]),
      name: country.name,
      type: NodeType.COUNTRY,
      results: await this.sectionsRepo.getResultsFor(
        makeSegment([electionRegion, country]),
      ),
      stats: await this.sectionsRepo.getStatsFor(
        makeSegment([electionRegion, country]),
      ),
      crumbs: this.crumbMaker.makeCrumbs([electionRegion]),
      abroad: true,
      nodesType: NodesType.TOWNS,
      nodes: (await this.townsRepo.filter(country.code)).map(
        ({ code, name, sections }) => ({
          id: code,
          name,
          type: NodeType.TOWN,
          NodesType: NodesType.ADDRESSES,
          nodes: groupSectionsByPlaceReducer(
            sections.map((section) => {
              section.stats = sectionsStats[section.id] || {}
              section.results = sectionsResults[section.id] || []
              return section
            }),
          ),
        }),
      ),
    }
  }

  private async getCityRegionResults(
    electionRegion: ElectionRegion,
    municipality: Municipality,
    district: CityRegion,
  ): Promise<Record<string, any>> {
    let nodesType: NodesType, nodes: any[]
    const sectionsStats = await this.sectionsRepo.getStatsFor(
      makeSegment([electionRegion, municipality, district]),
      9,
    )
    const sectionsResults = await this.sectionsRepo.getResultsFor(
      makeSegment([electionRegion, municipality, district]),
      9,
    )

    if (
      MUNICIPALITIES_MULTI_REGION.includes(
        `${electionRegion.code}${municipality.code}`,
      )
    ) {
      nodesType = NodesType.TOWNS
      nodes = (await this.townsRepo.findByCityRegion(district.id)).map(
        ({ code, name, sections }) => ({
          id: code,
          name,
          type: NodeType.TOWN,
          nodesType: NodesType.ADDRESSES,
          nodes: groupSectionsByPlaceReducer(
            sections.map((section) => {
              section.stats = sectionsStats[section.id] || {}
              section.results = sectionsResults[section.id] || []
              return section
            }),
          ),
        }),
      )
    } else {
      nodesType = NodesType.ADDRESSES
      nodes = groupSectionsByPlaceReducer(
        (await this.sectionsRepo.findByCityRegion(district.id)).map(
          (section) => {
            section.stats = sectionsStats[section.id] || {}
            section.results = sectionsResults[section.id] || []
            return section
          },
        ),
      )
    }

    return {
      id: district.code,
      segment: makeSegment([electionRegion, municipality, district]),
      name: district.name,
      type: NodeType.DISTRICT,
      results:
        (await this.sectionsRepo.getResultsFor(
          makeSegment([electionRegion, municipality, district]),
        )) || [],
      stats:
        (await this.sectionsRepo.getStatsFor(
          makeSegment([electionRegion, municipality, district]),
        )) || {},
      crumbs: this.crumbMaker.makeCrumbs([electionRegion, municipality]),
      abroad: false,
      nodesType,
      nodes,
    }
  }

  private async getSectionResults(
    electionRegion: ElectionRegion,
    unit: Country | Municipality,
    district: CityRegion | null,
    section: Section,
  ): Promise<Record<string, any>> {
    section.stats = (await this.sectionsRepo.getStatsFor(
      section.id,
    )) as StatsDto
    section.results = (await this.sectionsRepo.getResultsFor(
      section.id,
    )) as number[]
    section.protocols = await this.protocolsRepo.findBySection(section.id)

    return {
      ...sectionMapper(section),
      crumbs: this.crumbMaker.makeCrumbs([electionRegion, unit, district]),
      abroad: electionRegion.isAbroad,
      place: section.place,
      town: {
        id: section.town.code,
        name: section.town.name,
      },
      protocols: section.protocols.map((protocol: Protocol) =>
        this.updatePicturesUrl(
          ProtocolDto.fromEntity(protocol, ['protocol.protocolInResults']),
        ),
      ),
    }
  }
  private updatePicturesUrl(protocolDto: ProtocolDto) {
    protocolDto.pictures.forEach(
      (picture: PictureDto) =>
        (picture.url = this.urlGenerator.getUrl(picture)),
    )

    return protocolDto
  }
}
