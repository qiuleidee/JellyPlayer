import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, FastForward, Rewind, Play, Pause, Monitor } from 'lucide-react';
import styles from './OSD.module.css';

export type OSDType = 'volume' | 'mute' | 'forward' | 'rewind' | 'play' | 'pause' | 'quality' | 'subtitle' | 'audio' | 'none';

interface OSDProps {
  type: OSDType;
  value?: string | number;
  triggerId: number; // 用于触发重新动画
}

export default function OSD({ type, value, triggerId }: OSDProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type === 'none' || triggerId === 0) return;
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [type, value, triggerId]);

  const renderIcon = () => {
    switch (type) {
      case 'volume':
        return <Volume2 size={48} />;
      case 'mute':
        return <VolumeX size={48} />;
      case 'forward':
        return <FastForward size={48} />;
      case 'rewind':
        return <Rewind size={48} />;
      case 'play':
        return <Play size={48} fill="currentColor" />;
      case 'pause':
        return <Pause size={48} fill="currentColor" />;
      case 'quality':
      case 'subtitle':
      case 'audio':
        return <Monitor size={48} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles['osd-container']}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={styles['osd-box']}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className={styles['osd-icon']}>{renderIcon()}</div>
            {value !== undefined && <div className={styles['osd-text']}>{value}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
