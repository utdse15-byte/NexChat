/**
 * Zustand persist 迁移函数
 *
 * 接受 unknown 输入做形态守卫，再返回符合最新 schema 的状态。
 * 当前版本：chat=v1, config=v3
 */

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null;
}

export function migrateChatData(persistedState: unknown, _version: number): unknown {
  // chat 数据当前仅有 v1，无历史迁移逻辑
  return persistedState;
}

export function migrateConfigData(persistedState: unknown, version: number): unknown {
  if (!isRecord(persistedState)) return persistedState;
  let state: AnyRecord = persistedState;

  // v1 → v2：补全 provider 字段
  if (version <= 1) {
    state = { ...state, provider: state.provider || 'openai' };
  }

  // v2 → v3：补全后端模式字段
  if (version <= 2) {
    state = {
      ...state,
      backendEnabled: state.backendEnabled ?? false,
      backendUrl: state.backendUrl ?? '/api',
    };
  }

  return state;
}
