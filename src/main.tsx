import ReactDOM from 'react-dom/client'
import './index.css'
import Layout from './pages/Layout/Layout.tsx'
import { Provider } from 'jotai'
import { store } from './atom.ts'
import { App } from 'antd'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App>
      <Layout />
    </App>
  </Provider>,
)
