import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(function () { return {} }),
  PutObjectCommand: vi.fn().mockImplementation(function () { return {} }),
  GetObjectCommand: vi.fn().mockImplementation(function () { return {} }),
  DeleteObjectCommand: vi.fn().mockImplementation(function () { return {} }),
  ListObjectsV2Command: vi.fn().mockImplementation(function () { return {} }),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://r2.example.com/signed-url'),
}))

import { generateUploadUrl, generateDownloadUrl } from './storage.handler'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_CONFIG = {
  accountId: 'test-account',
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
  bucketName: 'test-bucket',
}

beforeEach(() => vi.clearAllMocks())

describe('generateUploadUrl', () => {
  it('returns a signed url and the key', async () => {
    vi.mocked(getSignedUrl).mockResolvedValue('https://r2.example.com/signed-url')
    const result = await generateUploadUrl(R2_CONFIG, 'uploads/test.jpg', 'image/jpeg', 3600)
    expect(result.url).toContain('r2.example.com')
    expect(result.key).toBe('uploads/test.jpg')
  })
})

describe('generateDownloadUrl', () => {
  it('returns a signed download url', async () => {
    vi.mocked(getSignedUrl).mockResolvedValue('https://r2.example.com/signed-url')
    const result = await generateDownloadUrl(R2_CONFIG, 'uploads/test.jpg', 3600)
    expect(result.url).toContain('r2.example.com')
  })
})
