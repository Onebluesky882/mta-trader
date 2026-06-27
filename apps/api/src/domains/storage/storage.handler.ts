import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

function createS3Client(config: R2Config) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export async function generateUploadUrl(
  config: R2Config,
  key: string,
  contentType: string,
  expiresIn: number,
) {
  const client = createS3Client(config)
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(client, command, { expiresIn })
  return { url, key }
}

export async function generateDownloadUrl(
  config: R2Config,
  key: string,
  expiresIn: number,
) {
  const client = createS3Client(config)
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  })
  const url = await getSignedUrl(client, command, { expiresIn })
  return { url, key }
}

export async function deleteFile(config: R2Config, key: string) {
  const client = createS3Client(config)
  await client.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: key }))
  return { deleted: key }
}

export async function listFiles(config: R2Config, prefix?: string) {
  const client = createS3Client(config)
  const result = await client.send(
    new ListObjectsV2Command({ Bucket: config.bucketName, Prefix: prefix }),
  )
  return result.Contents ?? []
}
