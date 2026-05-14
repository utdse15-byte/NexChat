import type { ChatError } from './types';

interface FetchErrorLike {
  name?: string;
  message?: string;
}

export function classifyFetchError(error: unknown, baseUrl: string): ChatError {
  const err = (error ?? {}) as FetchErrorLike;

  if (err.name === 'AbortError') {
    return { type: 'unknown_error', message: 'Aborted', retryable: false };
  }

  const isTypeError = err.name === 'TypeError' || err.message?.includes('Failed to fetch');
  if (isTypeError) {
    const isStandardOpenai = baseUrl.includes('api.openai.com');
    const msg = isStandardOpenai
      ? '网络连接失败，请检查您的网络。'
      : '网络连接失败或跨域被拦截(CORS)，请检查网络和 API 地址。';

    return {
      type: 'network_error',
      message: msg,
      retryable: true,
    };
  }

  if (err.message?.includes('timeout')) {
    return {
      type: 'timeout',
      message: '请求超时，请重试。',
      retryable: true,
    };
  }

  return {
    type: 'unknown_error',
    message: err.message || '未知异常',
    retryable: true,
  };
}

export async function classifyResponseError(response: Response): Promise<ChatError> {
  const status = response.status;
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch {
    // 读取响应体失败时静默继续
  }

  let errorMsg = bodyText;
  try {
    const json = JSON.parse(bodyText) as { error?: { message?: string } };
    if (json.error?.message) {
      errorMsg = json.error.message;
    }
  } catch {
    // 非 JSON 响应，沿用原始文本
  }

  if (status === 401 || status === 403) {
    return {
      type: 'auth_error',
      message: `认证失败 (${status}): ${errorMsg}`,
      retryable: false,
      statusCode: status,
    };
  }
  if (status === 429) {
    return {
      type: 'rate_limit',
      message: `请求过于频繁: ${errorMsg}`,
      retryable: true,
      statusCode: status,
    };
  }
  if (status >= 500) {
    return {
      type: 'server_error',
      message: `服务端错误 (${status}): ${errorMsg}`,
      retryable: true,
      statusCode: status,
    };
  }
  if (status === 400) {
    return {
      type: 'protocol_error',
      message: `请求参数错误: ${errorMsg}`,
      retryable: false,
      statusCode: status,
    };
  }

  return {
    type: 'unknown_error',
    message: `请求失败 (${status}): ${errorMsg}`,
    retryable: true,
    statusCode: status,
  };
}
