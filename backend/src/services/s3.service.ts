import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import type { Readable } from 'stream';

const s3Client = new S3Client({ region: env.AWS_REGION });

export async function createUploadUrl(tenantId: string, documentId: string, fileName: string): Promise<{ uploadUrl: string, storageKey: string }> {
    const storageKey = `contracts/${tenantId}/${documentId}/${fileName}`;
    const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        ContentType: 'application/pdf',
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return { uploadUrl, storageKey };
}

export async function createDownloadUrl(storageKey: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function headObject(storageKey: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: storageKey,
        });
        await s3Client.send(command);
        return true;
    } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
}

export async function getObjectStream(storageKey: string): Promise<Readable> {
    const command = new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
    });
    const response = await s3Client.send(command);
    return response.Body as Readable;
}
