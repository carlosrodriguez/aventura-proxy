import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
function client() {
  if (
    !process.env.SPACES_ENDPOINT ||
    !process.env.SPACES_BUCKET ||
    !process.env.SPACES_ACCESS_KEY ||
    !process.env.SPACES_SECRET_KEY
  )
    throw new Error("Private storage is not configured");
  return new S3Client({
    endpoint: process.env.SPACES_ENDPOINT,
    region: process.env.SPACES_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.SPACES_ACCESS_KEY,
      secretAccessKey: process.env.SPACES_SECRET_KEY,
    },
  });
}
export async function putPrivate(key: string, body: Uint8Array, type: string) {
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET,
      Key: key,
      Body: body,
      ContentType: type,
      ACL: "private",
    }),
  );
}
export async function readPrivate(key: string) {
  const res = await client().send(
    new GetObjectCommand({ Bucket: process.env.SPACES_BUCKET, Key: key }),
  );
  if (!res.Body) throw new Error("Missing object");
  return res.Body.transformToByteArray();
}
export async function temporaryUrl(key: string) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: process.env.SPACES_BUCKET,
      Key: key,
      ResponseContentDisposition: 'attachment; filename="limited-proxy.pdf"',
    }),
    { expiresIn: 60 },
  );
}
export async function deletePrivate(key: string) {
  await client().send(
    new DeleteObjectCommand({ Bucket: process.env.SPACES_BUCKET, Key: key }),
  );
}
