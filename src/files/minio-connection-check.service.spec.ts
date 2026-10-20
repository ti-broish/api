import { Logger } from '@nestjs/common'
import { Client as MinioClient } from 'minio'
import { MinioConnectionCheck } from './minio-connection-check.service'

describe('MinioConnectionCheck', () => {
  const client = (listBuckets: () => Promise<unknown>) =>
    ({ listBuckets } as unknown as MinioClient)

  afterEach(() => jest.restoreAllMocks())

  it('does not throw when the storage is unreachable, and warns', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined)
    const check = new MinioConnectionCheck(
      client(() =>
        Promise.reject(new Error('Missing tag: "ListAllMyBucketsResult"')),
      ),
    )
    expect(() => check.onApplicationBootstrap()).not.toThrow()
    await expect(check.check()).resolves.toBe(false)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('ListAllMyBucketsResult'),
    )
  })

  it('passes when the buckets can be listed', async () => {
    const check = new MinioConnectionCheck(client(() => Promise.resolve([])))
    await expect(check.check()).resolves.toBe(true)
  })
})
