import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from '@aws-sdk/client-textract';
import type { Block } from '@aws-sdk/client-textract';
import { env } from '../config/env.js';

const textractClient = new TextractClient({ region: env.AWS_REGION });

export async function startDocumentAnalysis(storageKey: string, documentId: string): Promise<string> {
  const command = new StartDocumentAnalysisCommand({
    DocumentLocation: { S3Object: { Bucket: env.S3_BUCKET, Name: storageKey } },
    FeatureTypes: ['TABLES', 'FORMS'],
    NotificationChannel: env.SNS_TEXTRACT_TOPIC_ARN
      ? { SNSTopicArn: env.SNS_TEXTRACT_TOPIC_ARN, RoleArn: env.TEXTRACT_ROLE_ARN! }
      : undefined,
    OutputConfig: { S3Bucket: env.S3_BUCKET, S3Prefix: `textract-output/${documentId}/` },
  });

  const response = await textractClient.send(command);

  if (!response.JobId) {
    throw new Error('No JobId returned from Textract');
  }

  return response.JobId;
}

export async function getDocumentAnalysis(jobId: string): Promise<Block[]> {
  const blocks: Block[] = [];
  let nextToken: string | undefined;

  do {
    const response = await textractClient.send(
      new GetDocumentAnalysisCommand({ JobId: jobId, NextToken: nextToken })
    );

    if (response.Blocks) {
      blocks.push(...response.Blocks);
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return blocks;
}
