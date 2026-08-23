export type FileUpload = {
  file: File;
  path: string;
  bucket?: string;
};

export type FileDownload = {
  path: string;
  bucket?: string;
};

export type FileDelete = {
  path: string;
  bucket?: string;
};

export type StorageFile = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
};
