import { Controller, Get, HttpCode, Param, ValidationPipe, UsePipes, NotFoundException } from '@nestjs/common';
import { Public } from 'src/auth/decorators';
import { CityRegion, Country, ElectionRegion, Municipality, Section, Town } from 'src/sections/entities';
import { ElectionRegionsRepository } from 'src/sections/entities/electionRegions.repository';
import { MunicipalitiesRepository } from 'src/sections/entities/municipalities.repository';
import { ElectionType } from './total-results.dto';
import { PartiesRepository } from 'src/parties/entities/parties.repository';
import { CountriesRepository } from 'src/sections/entities/countries.repository';
import { I18nService } from 'nestjs-i18n';
import { CityRegionsRepository } from 'src/sections/entities/cityRegions.repository';
import { SectionsRepository } from 'src/sections/entities/sections.repository';

export enum NodeType {
  ELECTION = 'election',
  ELECTION_REGION = 'electionRegion',
  COUNTRY = 'country',
  MUNICIPALITY = 'municipality',
  TOWN = 'town',
  DISTRICT = 'district',
  ADDRESS = 'address',
  SECTION = 'section',
};

export enum NodesType {
  ELECTION_REGIONS = 'electionRegions',
  COUNTRIES = 'countries',
  MUNICIPALITIES = 'municipalities',
  TOWNS = 'towns',
  DISTRICTS = 'districts',
  ADDRESSES = 'addresses',
  SECTIONS = 'sections',
};

const stats = {
  sectionsWithProtocols: 0,
  sectionsCount: 0,
  sectionsWithResults: 0,
  voters: 0,
  validVotes: 0,
  invalidVotes: 0,
  violationsCount: 0
};

const townsToCityRegionsReducer = (acc: Record<string, CityRegion>, town: Town) => {
  town.cityRegions.forEach((cityRegion: CityRegion) => {
    if (!acc[cityRegion.code]) {
      acc[cityRegion.code] = cityRegion;
    }
    if (!acc[cityRegion.code].towns) {
      acc[cityRegion.code].towns = [];
    }
    acc[cityRegion.code].towns.push(town);
  });
  delete town.cityRegions;
  return acc;
};

const groupByPlaceReducer = (acc: Record<string, Section[]>, section: Section) => {
  (acc[section.place] = acc[section.place] || []).push(section);
  return acc;
};

const sectionMapper = ({ code, id, votersCount }) => ({
  id: code,
  segment: `${id}`,
  name: `Секция ${code}`,
  type: NodeType.SECTION,
  results: [],
  stats: {
    voters: votersCount,
    validVotes: 0,
    invalidVotes: 0,
    violationsCount: 0,
  },
});

const mapSections = ([place, sections]: [string, Section[]]) => ({
  name: place,
  type: NodeType.ADDRESS,
  nodesType: NodesType.SECTIONS,
  nodes: sections.map(sectionMapper)
});

const groupSectionsByPlaceReducer = (sections: Section[]) => Object.entries(sections.reduce(groupByPlaceReducer, {})).map(mapSections);

const isMunicipalityShown = (municipality: Municipality) => municipality.towns.length === 1 || municipality.electionRegions.length > 1;

@Controller('results')
@Public()
export class ResultsController {
  constructor(
    private readonly electionRegionsRepo: ElectionRegionsRepository,
    private readonly partiesRepo: PartiesRepository,
    private readonly municipalitiesRepo: MunicipalitiesRepository,
    private readonly countriesRepo: CountriesRepository,
    private readonly cityRegionsRepo: CityRegionsRepository,
    private readonly sectionsRepo: SectionsRepository,
    private readonly i18n: I18nService,
  ) {}

  @Get('meta.json')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async meta(): Promise<Record<string, any>> {
    return {
      name: await this.i18n.translate(`results.META_NAME_${ElectionType.PARLIAMENT.toUpperCase()}`),
      parties: (await this.partiesRepo.findAllForResults())
        .map(({ id, name, displayName, color }) => (
        { id, name: name.replace(/\d+\.\s+(.*)/, '$1'), displayName: displayName.replace(/\d+\.\s+(.*)/, '$1'), color })
      )
    };
  }

  @Get('index.json')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(): Promise<Record<string, any>> {
    return {
      id: null,
      segment: "",
      name: await this.i18n.translate(`results.META_NAME_${ElectionType.PARLIAMENT.toUpperCase()}`),
      type: NodeType.ELECTION,
      results: [],
      stats,
      crumbs: [],
      abroad: false,
      nodesType: NodesType.ELECTION_REGIONS,
      nodes: (await this.electionRegionsRepo.findAllWithStats()).map(electionRegion => (
        {
          id: electionRegion.code,
          segment: electionRegion.code,
          name: electionRegion.name,
          type: NodeType.ELECTION_REGION,
          results: [],
          stats,
        }
      )),
    };
  }

  @Get(':segment.json')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async subset(
    @Param('segment') segment: string
  ): Promise<Record<string, any>> {
    if (!segment.match(/^\d{2}(\d{2}(\d{2}(\d{3})?)?)?$/)) {
      throw new NotFoundException();
    }

    const segments = segment.split(/^(\d{2})(\d{2})?(\d{2})?(\d{3})?$/).filter(x => x);

    const electionRegionCode = segments.shift();
    const electionRegion = await this.electionRegionsRepo.findOneOrFail(electionRegionCode);

    if (!segments.length) {
      return this.getElectionRegionResults(electionRegion);
    }

    let municipality: Municipality, country: Country;

    if (electionRegion.isAbroad) {
      const countryCode = segments.shift();
      if (countryCode === '00') {
        throw new NotFoundException();
      }
      country = await this.countriesRepo.findOneOrFail(countryCode);
    } else {
      municipality = await this.municipalitiesRepo.findOneOrFail(electionRegion, segments.shift());
    }

    if (!segments.length) {
      return electionRegion.isAbroad
        ? this.getCountryResults(electionRegion, country)
        : this.getMunicipalityResults(electionRegion, municipality);
    }

    const cityRegionCode = segments.shift();

    if (cityRegionCode === '00' && !segments.length) {
      throw new NotFoundException();
    }

    const cityRegion = cityRegionCode !== '00' ? (await this.cityRegionsRepo.findOneOrFail(electionRegion, cityRegionCode)) : null;

    if (!segments.length) {
      return this.getCityRegionResults(electionRegion, municipality, cityRegion);
    }

    const section = await this.sectionsRepo.findOneOrFail(segment);

    return this.getSectionResults(electionRegion, electionRegion.isAbroad ? country : municipality, cityRegion, section);
  }

  private async getElectionRegionResults(parent: ElectionRegion): Promise<Record<string, any>> {
    const electionRegion = await this.electionRegionsRepo.findOneWithStatsOrFail(parent);
    let nodesType: NodesType, nodes: any[];
    if (electionRegion.isAbroad) {
      nodes = (await this.countriesRepo.findAllAbroadWithStats()).map(country => ({
        id: country.id,
        segment: `${electionRegion.id}${country.id}`,
        name: country.name,
        type: NodeType.COUNTRY,
        results: [],
        stats,
      }));
    } else {
      nodesType = NodesType.MUNICIPALITIES;
      const municipalities = await this.municipalitiesRepo.findFromElectionRegionWithCityRegionsAndStats(electionRegion.id);
      if (municipalities.length === 1) {
        if (municipalities[0].electionRegions.length > 1) {
          nodesType = NodesType.DISTRICTS;
          const districts = municipalities[0].towns.reduce(townsToCityRegionsReducer, {});
          nodes = Object.entries(districts).map(([code, district]) => ({
            id: code,
            segment: `${electionRegion.code}${municipalities[0].code}${code}`,
            name: district.name,
            type: NodeType.DISTRICT,
            results: [],
            stats,
          }));
        } else {
          nodesType = NodesType.TOWNS;
          nodes = municipalities[0].towns.map(({ code: id, name, cityRegions }) => ({
            id,
            name,
            type: NodeType.TOWN,
            nodesType: NodesType.DISTRICTS,
            nodes: cityRegions.map(({ name, code: id }) => ({
              id,
              segment: `${electionRegion.code}${municipalities[0].code}${id}`,
              name,
              type: NodeType.DISTRICT,
              results: [],
              stats,
            }))
          }));
        }
      } else {
        nodesType = NodesType.MUNICIPALITIES;
        nodes = municipalities.map(({ code: id, name }) => ({
          id,
          segment: `${electionRegion.code}${id}`,
          name,
          type: NodeType.MUNICIPALITY,
          results: [],
          stats: { ...stats, ...electionRegion.stats },
        }));
      }
    }

    return {
      id: electionRegion.code,
      segment: `${electionRegion.code}`,
      name: electionRegion.name,
      type: NodeType.ELECTION_REGION,
      results: [],
      stats: {
        sectionsWithProtocols: 0,
        sectionsCount: 0,
        sectionsWithResults: 0,
        voters: 0,
        validVotes: 0,
        invalidVotes: 0,
        violationsCount: 0
      },
      crumbs: [
        {
          segment: '',
          name: await this.i18n.translate(`results.META_NAME_${ElectionType.PARLIAMENT.toUpperCase()}`),
          type: NodeType.ELECTION,
        }
      ],
      abroad: electionRegion.isAbroad,
      nodesType,
      nodes,
    };
  }

  private async getMunicipalityResults(electionRegion: ElectionRegion, municipality: Municipality): Promise<Record<string, any>> {
    if (isMunicipalityShown(municipality)) {
      throw new NotFoundException();
    }
    municipality = await this.municipalitiesRepo.findOneWithStatsOrFail(electionRegion, municipality);

    const { code, name } = municipality;
    return {
      id: code,
      segment: `${electionRegion.code}${code}`,
      name,
      type: NodeType.MUNICIPALITY,
      results: [],
      stats,
      crumbs: [
        {
          segment: '',
          name: await this.i18n.translate(`results.META_NAME_${ElectionType.PARLIAMENT.toUpperCase()}`),
          type: NodeType.ELECTION,
        },
        {
          segment: `${electionRegion.code}`,
          name: electionRegion.name,
          type: NodeType.ELECTION_REGION,
        }
      ],
      abroad: false,
      nodesType: NodesType.TOWNS,
      nodes: municipality.towns.map(({ code: id, name, sections }) => ({
        id,
        name,
        type: NodeType.TOWN,
        nodesType: NodesType.ADDRESSES,
        nodes: groupSectionsByPlaceReducer(sections),
      })),
    };
  }

  private async getCountryResults(electionRegion: ElectionRegion, country: Country): Promise<Record<string, any>> {
    return {
      id: country.code,
      segment: `${electionRegion.code}${country.code}`,
      name: country.name,
      type: NodeType.COUNTRY,
      results: [],
      stats: {
        sectionsWithProtocols: 0,
        sectionsCount: 0,
        sectionsWithResults: 0,
        voters: 0,
        validVotes: 0,
        invalidVotes: 0,
        violationsCount: 0
      },
      crumbs: [
        {
          segment: '',
          name: await this.i18n.translate(`results.META_NAME_${ElectionType.PARLIAMENT.toUpperCase()}`),
          type: NodeType.ELECTION,
        },
        {
          segment: `${electionRegion.code}`,
          name: electionRegion.name,
          type: NodeType.ELECTION_REGION,
        }
      ],
      abroad: true,
      nodesType: NodesType.TOWNS,
      nodes: country.towns.map(({ code, name, sections }) => ({
        id: code,
        name,
        type: NodeType.TOWN,
        NodesType: NodesType.ADDRESSES,
        nodes: groupSectionsByPlaceReducer(sections),
      }))
    };
  }

  private async getCityRegionResults(electionRegion: ElectionRegion, municipality: Municipality, district: CityRegion): Promise<Record<string, any>> {
    const crumbs = [
      {
        segment: '',
        name: await this.i18n.translate(`results.META_NAME_${ElectionType.PARLIAMENT.toUpperCase()}`),
        type: NodeType.ELECTION,
      },
      {
        segment: `${electionRegion.code}`,
        name: electionRegion.name,
        type: NodeType.ELECTION_REGION,
      }
    ];
    if (isMunicipalityShown(municipality)) {
      crumbs.push({
        segment: `${electionRegion.code}${municipality.code}`,
        name: electionRegion.name,
        type: NodeType.ELECTION_REGION,
      });
    }

    let nodesType: NodesType, nodes: any[];

    if (municipality.electionRegions.length > 1) {
      nodesType = NodesType.TOWNS;
      nodes = district.towns.map(({ code, name, sections }) => ({
        id: code,
        name,
        type: NodeType.TOWN,
        nodesType: NodesType.ADDRESSES,
        nodes: groupSectionsByPlaceReducer(sections),
      }));
    } else {
      nodesType = NodesType.ADDRESSES;
      nodes = groupSectionsByPlaceReducer(district.sections);
    }

    return {
      id: district.code,
      segment: `${electionRegion.code}${municipality.code}${district.code}`,
      name: district.name,
      type: NodeType.DISTRICT,
      results: [],
      stats,
      crumbs,
      abroad: false,
      nodesType,
      nodes,
    };
  }

  private async getSectionResults(electionRegion: ElectionRegion, unit: Country | Municipality, district: CityRegion | null, section: Section): Promise<Record<string, any>> {
    return {
      ...sectionMapper(section),
      crumbs: [
        {
          segment: '',
          name: await this.i18n.translate(`results.META_NAME_${ElectionType.PARLIAMENT.toUpperCase()}`),
          type: NodeType.ELECTION,
        },
        {
          segment: `${electionRegion.code}`,
          name: electionRegion.name,
          type: NodeType.ELECTION_REGION,
        },
        {
          segment: `${electionRegion.code}${unit.code}`,
          name: unit.name,
          type: unit instanceof Country ? NodeType.COUNTRY : NodeType.MUNICIPALITY,
        },
        district ? {
          segment: `${electionRegion.code}${unit.code}${district.code}`,
          name: district.name,
          type: NodeType.DISTRICT,
        } : null
      ].filter(x => !!x),
      abroad: electionRegion.isAbroad,
      place: section.place,
      town: {
        id: section.town.code,
        name: section.town.name,
      }
    };
  }
}
