import { useEffect, useState } from 'react';
import { useUIStore } from '../../../stores/uiStore';
import styles from './TopProgress.module.css';

export default function TopProgress() {
  const globalLoading = useUIStore((s) => s.globalLoading);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (globalLoading) {
      setVisible(true);
      setProgress(10);
      
      // 模拟进度增加
      timer = setInterval(() => {
        setProgress((prev) => {
          const inc = Math.random() * 10;
          return prev + inc > 90 ? 90 : prev + inc;
        });
      }, 500);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }

    return () => clearInterval(timer);
  }, [globalLoading]);

  if (!visible) return null;

  return (
    <div className={styles['top-progress']}>
      <div 
        className={styles['progress-bar']} 
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}
