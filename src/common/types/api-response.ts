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

export interface MetaData extends Record<string, any> {
  timestamp: string;
  totalItems?: number;
  itemCount?: number;
  itemsPerPage?: number;
  totalPages?: number;
  currentPage?: number;
}

