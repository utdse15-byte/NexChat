import type { ChatError } from './types';

export function classifyFetchError(error: any, baseUrl: string): ChatError {
  if (error.name === 'AbortError') {
    return { type: 'unknown_error', message: 'Aborted', retryable: false }; 
  }

  const isTypeError = error.name === 'TypeError' || error.message?.includes('Failed to fetch');
  if (isTypeError) {
    const isStandardOpenai = baseUrl.includes('api.openai.com');
    const msg = isStandardOpenai 
      ? '网络连接失败，请检查您的网络。'
      : '网络连接失败或跨域被拦截(CORS)，请检查网络和 API 地址。';
      
    return {
      type: 'network_error',
      message: msg,
      retryable: true
    };
  }

  if (error.message && error.message.includes('timeout')) {
    return {
      type: 'timeout',
      message: '请求超时，请重试。',
      retryable: true
    };
  }

  return {
    type: 'unknown_error',
    message: error.message || '未知异常',
    retryable: true
  };
}

export async function classifyResponseError(response: Response): Promise<ChatError> {
  const status = response.status;
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch (e) {
    // ignore
  }

  let errorMsg = bodyText;
  try {
    const json = JSON.parse(bodyText);
    if (json.error && json.error.message) {
      errorMsg = json.error.message;
    }
  } catch (e) {
    // ignore
  }

  if (status === 401 || status === 403) {
    return { type: 'auth_error', message: `认证失败 (${status}): ${errorMsg}`, retryable: false, statusCode: status };
  }
  if (status === 429) {
    return { type: 'rate_limit', message: `请求过于频繁: ${errorMsg}`, retryable: true, statusCode: status };
  }
  if (status >= 500) {
    return { type: 'server_error', message: `服务端错误 (${status}): ${errorMsg}`, retryable: true, statusCode: status };
  }
  if (status === 400) {
    return { type: 'protocol_error', message: `请求参数错误: ${errorMsg}`, retryable: false, statusCode: status };
  }

  return {
    type: 'unknown_error',
    message: `请求失败 (${status}): ${errorMsg}`,
    retryable: true,
    statusCode: status
  };
}
