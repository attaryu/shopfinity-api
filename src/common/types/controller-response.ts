export interface ControllerResponse<T = any> {
  message: string;
  data?: T | null;
  meta?: any;
}

