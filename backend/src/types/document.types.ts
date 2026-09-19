import { z } from 'zod';

export type DocumentStatus = 'UPLOADED' | 'QUEUED' | 'EXTRACTING' | 'CHUNKING' | 'EMBEDDING' | 'READY' | 'FAILED';

export type AclPermission = 'READ' | 'WRITE' | 'ADMIN';

export interface Document {
  documentId: string;
  tenantId: string;
  fileName: string;
  storageKey: string;
  fileSize: number;
  checksum: string;
  status: DocumentStatus;
  errorMessage: string | null;
  textractJobId: string | null;
  totalPages?: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentAcl {
  aclId: string;
  documentId: string;
  tenantId: string;
  userId: string;
  permission: AclPermission;
  grantedAt: Date;
}

export const UploadIntentRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive().max(104857600),
  checksum: z.string().length(64),
});

export type UploadIntentRequest = z.infer<typeof UploadIntentRequestSchema>;

export interface UploadIntentResponse {
  documentId: string;
  uploadUrl: string;
  storageKey: string;
}
