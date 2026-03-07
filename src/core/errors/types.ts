export type ErrorType =
  | 'auth_error'       // 401/403
  | 'rate_limit'       // 429
  | 'network_error'    // fetch 失败、断网
  | 'timeout'          // 首字节超时或流空转超时
  | 'cors_error'       // CORS 拦截
  | 'protocol_error'   // SSE/JSON 解析失败
  | 'server_error'     // 5xx
  | 'unknown_error';

export interface ChatError {
  type: ErrorType;
  message: string;
  retryable: boolean;
  statusCode?: number;
}
