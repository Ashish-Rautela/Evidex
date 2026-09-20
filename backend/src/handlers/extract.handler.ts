import type { SQSEvent } from 'aws-lambda';
import type { IngestionEvent } from '../types/events.types.js';
import { startDocumentAnalysis, notifyExtractionComplete } from '../services/textract.service.js';
import { updateDocumentStatus } from '../db/queries/documents.queries.js';

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const ingestionEvent: IngestionEvent = JSON.parse(record.body);
    try {
      await updateDocumentStatus(ingestionEvent.documentId, 'EXTRACTING');
      const jobId = await startDocumentAnalysis(ingestionEvent.storageKey, ingestionEvent.documentId);
      await updateDocumentStatus(ingestionEvent.documentId, 'EXTRACTING', { textractJobId: jobId });
      await notifyExtractionComplete(jobId);
    } catch (err) {
      console.error(`ExtractHandler failed for document ${ingestionEvent.documentId}:`, err);
      await updateDocumentStatus(ingestionEvent.documentId, 'FAILED', { errorMessage: (err as Error).message });
      throw err;
    }
  }
};
