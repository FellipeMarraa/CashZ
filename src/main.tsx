import {OrientationWarning} from "@/components/orientation-warning.tsx";

if (typeof global === 'undefined') {
    (window as any).global = window;
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const warningRoot = document.getElementById("orientation-warning-root");

createRoot(document.getElementById('root')!).render(
    <App />
);

if (warningRoot) {
    createRoot(warningRoot).render(<OrientationWarning />);
}
