import { LazyImage } from '../../ui';
import { ImageUtils } from '../../../api/images';
import type { BaseItemPerson } from '../../../types/items';
import styles from './CastRow.module.css';

interface CastRowProps {
  people: BaseItemPerson[];
}

export default function CastRow({ people }: CastRowProps) {
  if (!people || people.length === 0) return null;

  // 过滤出主要演员和导演
  const displayPeople = people.filter((p) => p.Type === 'Actor' || p.Type === 'Director');

  if (displayPeople.length === 0) return null;

  return (
    <div className={styles['cast-row']}>
      <h3 className={styles['cast-title']}>演职人员</h3>
      <div className={styles['cast-scroll']}>
        {displayPeople.map((person) => {
          const avatarUrl = person.PrimaryImageTag
            ? ImageUtils.getPosterUrl(person.Id, person.PrimaryImageTag)
            : null;

          return (
            <div key={person.Id + person.Role} className={styles['cast-card']}>
              <div className={styles['cast-avatar-wrapper']}>
                {avatarUrl ? (
                  <LazyImage src={avatarUrl} alt={person.Name} className={styles['cast-avatar']} />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-500 text-2xl font-bold">
                    {person.Name.charAt(0)}
                  </div>
                )}
              </div>
              <div className={styles['cast-info']}>
                <div className={styles['cast-name']}>{person.Name}</div>
                <div className={styles['cast-role']}>{person.Role || person.Type}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
