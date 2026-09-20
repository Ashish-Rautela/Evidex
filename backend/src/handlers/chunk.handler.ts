import type { SQSEvent } from 'aws-lambda';
import { getDocumentByTextractJobId, updateDocumentStatus } from '../db/queries/documents.queries.js';
import { insertClauses } from '../db/queries/clauses.queries.js';
import { insertChunks } from '../db/queries/chunks.queries.js';
import { getDocumentAnalysis } from '../services/textract.service.js';
import { parseTextractBlocks } from '../pipeline/textract-parser.js';
import { parseLegalStructure } from '../pipeline/legal-parser.js';
import { generateChunks } from '../pipeline/chunker.js';
import { embedChunks } from '../pipeline/embedder.js';

export const handler = async (event: any): Promise<void> => {
  if (!event?.Records || !Array.isArray(event.Records)) return;

  for (const record of event.Records) {
    let message: any;
    try {
      if (record.Sns?.Message) {
        // Direct SNS event
        message = typeof record.Sns.Message === 'string' ? JSON.parse(record.Sns.Message) : record.Sns.Message;
      } else if (record.body) {
        // SQS event (which may wrap an SNS notification or be direct JSON)
        const parsedBody = JSON.parse(record.body);
        message = parsedBody?.Message ? (typeof parsedBody.Message === 'string' ? JSON.parse(parsedBody.Message) : parsedBody.Message) : parsedBody;
      } else {
        message = record;
      }
    } catch (parseErr) {
      console.error('Failed to parse message record:', parseErr, record);
      continue;
    }

    const jobId = message?.JobId;
    const status = message?.Status;
    
    if (!jobId) {
      console.warn('Skipping record with missing JobId:', message);
      continue;
    }
    
    const doc = await getDocumentByTextractJobId(jobId);
    if (!doc) {
      console.warn(`Document not found for JobId: ${jobId}`);
      continue;
    }
    
    try {
      if (status !== 'SUCCEEDED') {
        await updateDocumentStatus(doc.documentId, 'FAILED', { errorMessage: `Textract failed with status ${status}` });
        continue;
      }
      
      await updateDocumentStatus(doc.documentId, 'CHUNKING');
      
      const blocks = await getDocumentAnalysis(jobId);
      const pages = parseTextractBlocks(blocks);
      const nodes = parseLegalStructure(pages);
      
      const { parentClauses, childChunks } = generateChunks(nodes, doc.documentId, doc.tenantId);
      await insertClauses(parentClauses);
      
      await updateDocumentStatus(doc.documentId, 'EMBEDDING');
      
      const chunksWithEmbeddings = await embedChunks(childChunks);
      await insertChunks(chunksWithEmbeddings);
      
      await updateDocumentStatus(doc.documentId, 'READY', { totalPages: pages.length });
    } catch (err) {
      console.error(`ChunkHandler failed for document ${doc.documentId}:`, err);
      await updateDocumentStatus(doc.documentId, 'FAILED', { errorMessage: (err as Error).message });
    }
  }
};
