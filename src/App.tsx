import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import './App.css'
import ToastHost from "./components/toast/ToastHost";

function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
            <ToastHost />
        </BrowserRouter>
    )
}

export default App