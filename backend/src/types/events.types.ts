export interface IngestionEvent {
  documentId: string;
  tenantId: string;
  storageKey: string;
  createdAt: string;
}

export interface TextractCompleteEvent {
  jobId: string;
  status: string;
  documentLocation: {
    s3Bucket: string;
    s3ObjectName: string;
  };
}
