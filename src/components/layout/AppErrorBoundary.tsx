import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clear } from 'idb-keyval';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh w-full items-center justify-center bg-slate-950 text-slate-50 p-4">
          <div className="max-w-md p-6 bg-slate-900 border border-red-500/20 rounded-2xl shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-3xl mb-4">
              ⚠️
            </div>
            <h2 className="text-xl font-semibold mb-2">出错了</h2>
            <p className="text-slate-400 text-sm mb-6">
              应用遇到了未知的错误，可能是缓存过旧或浏览器兼容问题导致。
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-medium transition-colors cursor-pointer"
              >
                刷新页面
              </button>
              <button 
                onClick={async () => {
                  localStorage.clear();
                  await clear();
                  window.location.reload();
                }}
                className="w-full py-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-lg transition-colors cursor-pointer text-sm"
              >
                清除缓存并重置所有数据
              </button>
            </div>
            <div className="mt-4 p-2 bg-black/30 rounded text-xs text-red-300 text-left overflow-auto max-h-32">
                 {this.state.error?.message}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
