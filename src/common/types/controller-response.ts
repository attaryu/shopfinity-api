export interface ControllerResponse<T = Record<string, unknown>> {
  message: string;
  data: T;
}
