import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import VConsole from 'vconsole';

// 初始化移动端调试工具 (屏幕右下角绿色按钮)
new VConsole();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
