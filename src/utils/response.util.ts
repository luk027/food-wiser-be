export type ResponseFormat<T = unknown> = {
  success: boolean;
  message: string;
  status: number;
  data?: T;
};

export function createResponse<T = unknown>(
  success: boolean,
  message: string,
  status: number,
  data?: T,
): ResponseFormat<T> {
  return {
    success,
    message,
    status,
    ...(data !== undefined && { data }),
  };
}
