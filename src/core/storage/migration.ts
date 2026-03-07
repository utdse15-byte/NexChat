export function migrateChatData(persistedState: any, _version: number): any {
  if (_version === 0) {
    // future migrations from 0 to 1
  }
  return persistedState;
}

export function migrateConfigData(persistedState: any, _version: number): any {
  return persistedState;
}
