export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ParentClause {
  clauseId: string;
  documentId: string;
  tenantId: string;
  clauseIdentifier: string | null;
  title: string | null;
  fullText: string;
  hierarchyPath: string | null;
  startPage: number;
  endPage: number;
  tokenCount: number | null;
}

export interface ChildChunk {
  chunkId: string;
  clauseId: string;
  documentId: string;
  tenantId: string;
  chunkIndex: number;
  pageNumber: number;
  chunkText: string;
  tokenCount: number | null;
  coordinates: BoundingBox;
  embedding: number[];
  embeddingModel: string;
}
