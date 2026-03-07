import { ConfigProvider, theme } from 'antd';
import AppLayout from '../components/layout/AppLayout';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#22d3ee', // cyan-400
          colorBgBase: '#020617', // slate-950
        },
      }}
    >
      <AppLayout />
    </ConfigProvider>
  )
}

export default App;
