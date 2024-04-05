import ReactDOM from 'react-dom/client'
import './index.css'
import Layout from './Layout.tsx'
import { Provider } from 'jotai'
import { store } from './atom.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(<Provider store={store}><Layout /></Provider>)
