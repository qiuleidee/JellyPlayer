import { extractMediaBadges } from '../../../utils/mediaBadges';
import type { BaseItemDto } from '../../../types/items';
import styles from './MediaBadges.module.css';

interface MediaBadgesProps {
  item: BaseItemDto;
  className?: string;
}

export function MediaBadges({ item, className = '' }: MediaBadgesProps) {
  const badges = extractMediaBadges(item);

  if (badges.length === 0) return null;

  return (
    <div className={`${styles['media-badges-container']} ${className}`}>
      {badges.map((badge, idx) => (
        <span 
          key={`${badge.type}-${idx}`} 
          className={`${styles['media-badge']} ${styles[badge.colorClass]}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
