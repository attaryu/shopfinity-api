export interface ControllerResponse<T = unknown> {
  message: string;
  data: T;
}
