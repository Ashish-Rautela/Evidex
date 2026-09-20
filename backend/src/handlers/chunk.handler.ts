import type { SQSEvent } from 'aws-lambda';
import { getDocumentByTextractJobId, updateDocumentStatus } from '../db/queries/documents.queries.js';
import { insertClauses } from '../db/queries/clauses.queries.js';
import { insertChunks } from '../db/queries/chunks.queries.js';
import { getDocumentAnalysis } from '../services/textract.service.js';
import { parseTextractBlocks } from '../pipeline/textract-parser.js';
import { parseLegalStructure } from '../pipeline/legal-parser.js';
import { generateChunks } from '../pipeline/chunker.js';
import { embedChunks } from '../pipeline/embedder.js';

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const raw = JSON.parse(record.body);
    // ponytail: handle both direct SQS message and SNS-over-SQS envelope
    const message = raw.Message ? JSON.parse(raw.Message) : raw;
    const jobId = message.JobId;
    const status = message.Status;
    
    if (!jobId) continue;
    
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
