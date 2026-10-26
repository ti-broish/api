import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory'
import { ConfigService } from '@nestjs/config'
import { User } from 'src/users/entities'
import { Role } from 'src/casl/role.enum'
import { AbroadAddressesService } from '../abroad-addresses'
import { AbroadAddressesController } from './abroad-addresses.controller'

const CSV =
  'section_id,country,place,address\n' +
  '320902332,Норвегия,Тромсьо,"Kvaløyvegen 332, 9016 Tromsø"\n' +
  '320010003,Австралия,Канбера,"Moonah Pl 33, Yarralumla"\n'

describe('/sections/abroad', () => {
  let app: INestApplication
  let currentUser: User | undefined
  const list = jest.fn()
  const updateAddresses = jest.fn()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AbroadAddressesController],
      providers: [
        {
          provide: AbroadAddressesService,
          useValue: { list, updateAddresses },
        },
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
    list.mockReset()
    updateAddresses.mockReset()
    updateAddresses.mockResolvedValue({ dryRun: false, received: 2 })
    currentUser = userWithRoles([Role.User, Role.Admin])
  })

  describe('GET', () => {
    it('lists the abroad sections without a user', async () => {
      currentUser = undefined
      const item = {
        id: '320902332',
        code: '332',
        place: 'Тромсьо',
        address: 'Kvaløyvegen 332, 9016 Tromsø',
        town: { id: 100320, name: 'Тромсьо' },
        country: { code: '090', name: 'Норвегия' },
      }
      list.mockResolvedValue([item])
      const res = await request(app.getHttpServer())
        .get('/sections/abroad')
        .expect(200)
      expect(res.body).toEqual([item])
      expect(res.headers['cache-control']).toBe('public, max-age=300')
    })
  })

  describe('PATCH addresses', () => {
    it('accepts a CSV upload from an admin', async () => {
      const res = await request(app.getHttpServer())
        .patch('/sections/abroad/addresses')
        .attach('file', Buffer.from(CSV), 'abroad_addresses.csv')
        .expect(200)
      expect(res.body).toEqual({ dryRun: false, received: 2 })
      expect(updateAddresses).toHaveBeenCalledWith(
        [
          { sectionId: '320902332', address: 'Kvaløyvegen 332, 9016 Tromsø' },
          { sectionId: '320010003', address: 'Moonah Pl 33, Yarralumla' },
        ],
        { dryRun: false },
      )
    })

    it('accepts JSON and dryRun=true', async () => {
      await request(app.getHttpServer())
        .patch('/sections/abroad/addresses?dryRun=true')
        .send({ sections: [{ id: '320902332', address: 'Kvaløyvegen 332' }] })
        .expect(200)
      expect(updateAddresses).toHaveBeenCalledWith(
        [{ sectionId: '320902332', address: 'Kvaløyvegen 332' }],
        { dryRun: true },
      )
    })

    it('rejects domestic ids and missing addresses with 400', async () => {
      const res = await request(app.getHttpServer())
        .patch('/sections/abroad/addresses')
        .send({
          sections: [
            { id: '234615001', address: 'ул. Шипка 1' },
            { id: '320902332', address: ' ' },
          ],
        })
        .expect(400)
      expect(res.body.errors).toHaveLength(2)
      expect(updateAddresses).not.toHaveBeenCalled()
    })

    it('rejects a bad dryRun', async () => {
      await request(app.getHttpServer())
        .patch('/sections/abroad/addresses?dryRun=maybe')
        .send({ sections: [{ id: '320902332', address: 'x' }] })
        .expect(400)
    })

    it('rejects non-admins', async () => {
      currentUser = userWithRoles([Role.User, Role.Validator])
      await request(app.getHttpServer())
        .patch('/sections/abroad/addresses')
        .send({ sections: [{ id: '320902332', address: 'x' }] })
        .expect(403)
      currentUser = undefined
      await request(app.getHttpServer())
        .patch('/sections/abroad/addresses')
        .send({ sections: [{ id: '320902332', address: 'x' }] })
        .expect((res) => expect([401, 403]).toContain(res.status))
      expect(updateAddresses).not.toHaveBeenCalled()
    })
  })
})
