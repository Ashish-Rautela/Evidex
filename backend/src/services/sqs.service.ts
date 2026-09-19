import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { env } from '../config/env.js';

const sqsClient = new SQSClient({ region: env.AWS_REGION });

export async function publishIngestionEvent(event: any): Promise<void> {
    const command = new SendMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(event),
    });
    await sqsClient.send(command);
}
