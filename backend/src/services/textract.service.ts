// ponytail: Temporary pdf-parse bypass while AWS account activates Textract.
// Revert this file to git HEAD once SubscriptionRequiredException is resolved.
// Ceiling: no OCR for scanned/image PDFs — text-based PDFs only.
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
// @ts-ignore — pdf-parse root entry imports a test PDF that breaks bundlers
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { env } from '../config/env.js';

const s3 = new S3Client({ region: env.AWS_REGION });
const sns = new SNSClient({ region: env.AWS_REGION });

export async function startDocumentAnalysis(storageKey: string, documentId: string): Promise<string> {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }));
  const pdfBuffer = Buffer.from(await Body!.transformToByteArray());

  // Extract text per page, grouped into lines by Y-coordinate
  const blocks: any[] = [];
  let currentPage = 0;

  await pdfParse(pdfBuffer, {
    pagerender: async (pageData: any) => {
      currentPage++;
      const textContent = await pageData.getTextContent();
      const items = textContent.items as Array<{ str: string; transform: number[] }>;

      if (!items || items.length === 0) return '';

      // Group text items into lines by Y position
      const lineMap = new Map<number, string[]>();
      for (const item of items) {
        if (!item.str?.trim()) continue;
        // Round Y to nearest 2px to merge items on the same visual line
        const y = Math.round(item.transform[5] / 2) * 2;
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y)!.push(item.str);
      }

      // Sort lines top-to-bottom (PDF Y is bottom-up, so descending)
      const sortedLines = [...lineMap.entries()]
        .sort(([a], [b]) => b - a)
        .map(([, texts]) => texts.join(' ').trim())
        .filter(text => text.length > 0);

      for (const lineText of sortedLines) {
        blocks.push({
          BlockType: 'LINE',
          Text: lineText,
          Page: currentPage,
          Geometry: { BoundingBox: { Top: 0, Left: 0, Width: 1, Height: 0 } },
        });
      }

      return sortedLines.join('\n');
    },
  });

  if (blocks.length === 0) {
    console.warn(`pdf-parse extracted 0 lines from ${storageKey} — document may be scanned/image-only`);
  }

  // Save blocks to S3 (same prefix Textract would use)
  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: `textract-output/${documentId}/blocks.json`,
    Body: JSON.stringify(blocks),
    ContentType: 'application/json',
  }));

  return documentId;
}

// ponytail: split from startDocumentAnalysis to let the caller save textractJobId before notifying
export async function notifyExtractionComplete(documentId: string): Promise<void> {
  if (env.SNS_TEXTRACT_TOPIC_ARN) {
    await sns.send(new PublishCommand({
      TopicArn: env.SNS_TEXTRACT_TOPIC_ARN,
      Message: JSON.stringify({ JobId: documentId, Status: 'SUCCEEDED' }),
    }));
  }
}

export async function getDocumentAnalysis(jobId: string): Promise<any[]> {
  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: `textract-output/${jobId}/blocks.json`,
  }));
  return JSON.parse(await Body!.transformToString());
}
