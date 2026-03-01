export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  error: ErrorDetail | null;
  meta?: MetaData;
}

export interface ErrorDetail {
  type: string;
  details?: string | string[] | Record<string, any>;
}

export interface MetaData {
  timestamp: string;
  pagination?: PaginationMetaData;
}

export interface PaginationMetaData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
