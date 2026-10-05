import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory'
import { ConfigService } from '@nestjs/config'
import { User } from 'src/users/entities'
import { Role } from 'src/casl/role.enum'
import { AbroadSectionsConflictError, AbroadSectionsService } from '../abroad'
import { AbroadSectionsController } from './abroad-sections.controller'

const CSV =
  'Държава,№ на секция,Секционна избирателна комисия\n' +
  'Австралия,320012001,Аделаида\n' +
  'Австралия,320010003,Канбера (Посолство)\n'

describe('PUT /sections/abroad', () => {
  let app: INestApplication
  let currentUser: User | undefined
  const replace = jest.fn()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AbroadSectionsController],
      providers: [
        { provide: AbroadSectionsService, useValue: { replace } },
        PoliciesGuard,
        CaslAbilityFactory,
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile()
    app = moduleRef.createNestApplication()
    // Stand-in for the global Firebase guard: attach the current user
    app.use((req, _res, next) => {
      req.user = currentUser
      next()
    })
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const userWithRoles = (roles: Role[]): User => {
    const user = new User()
    user.roles = roles
    return user
  }

  beforeEach(() => {
    replace.mockReset()
    replace.mockResolvedValue({ dryRun: false, received: 2 })
    currentUser = userWithRoles([Role.User, Role.Admin])
  })

  it('accepts a CSV upload from an admin', async () => {
    const res = await request(app.getHttpServer())
      .put('/sections/abroad')
      .attach('file', Buffer.from(CSV), 'sections_abroad.csv')
      .expect(200)
    expect(res.body).toEqual({ dryRun: false, received: 2 })
    expect(replace).toHaveBeenCalledTimes(1)
    const [sections, options] = replace.mock.calls[0]
    expect(options).toEqual({ dryRun: false })
    expect(sections.map((s) => s.sectionId)).toEqual(['320012001', '320010003'])
    expect(sections[1]).toMatchObject({
      townName: 'Канбера',
      place: 'Посолство',
    })
  })

  it('accepts JSON rows and dryRun=true', async () => {
    await request(app.getHttpServer())
      .put('/sections/abroad?dryRun=true')
      .send({
        sections: [
          {
            Държава: 'Австралия',
            '№ на секция': '320012001',
            'Секционна избирателна комисия': 'Аделаида',
          },
        ],
      })
      .expect(200)
    expect(replace.mock.calls[0][1]).toEqual({ dryRun: true })
  })

  it('rejects non-admins', async () => {
    currentUser = userWithRoles([Role.User, Role.Validator])
    await request(app.getHttpServer())
      .put('/sections/abroad')
      .attach('file', Buffer.from(CSV), 'sections_abroad.csv')
      .expect(403)
    currentUser = undefined
    await request(app.getHttpServer())
      .put('/sections/abroad')
      .attach('file', Buffer.from(CSV), 'sections_abroad.csv')
      .expect(403)
    expect(replace).not.toHaveBeenCalled()
  })

  it('returns 400 with every input error and changes nothing', async () => {
    const res = await request(app.getHttpServer())
      .put('/sections/abroad')
      .attach(
        'file',
        Buffer.from(CSV + 'България,010100001,Банско\n'),
        'sections_abroad.csv',
      )
      .expect(400)
    expect(res.body.errors).toEqual([
      'row 4: section id "010100001" is not a 9-digit abroad id starting with 32',
    ])
    expect(replace).not.toHaveBeenCalled()
  })

  it('returns 400 without a file or sections', async () => {
    await request(app.getHttpServer())
      .put('/sections/abroad')
      .send({})
      .expect(400)
  })

  it('returns 409 on a database conflict', async () => {
    replace.mockRejectedValue(new AbroadSectionsConflictError('name taken'))
    await request(app.getHttpServer())
      .put('/sections/abroad')
      .attach('file', Buffer.from(CSV), 'sections_abroad.csv')
      .expect(409)
  })
})
